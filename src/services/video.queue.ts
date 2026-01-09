import { Queue, Worker, Job, Processor } from "bullmq";
import IORedis from "ioredis";
import envConfig from "@/utils/validateEnv";
import databaseService from "./database.service";
import Video, { EncodingStatus } from "@/models/schemas/video.schema";
import { encodeHLSWithMultipleVideoStreams } from "@/utils/ffmpeg";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";
import { ObjectId } from "mongodb";

// Initialize Redis connection options
const connectionOptions = {
  host: envConfig.REDIS_HOST,
  port: parseInt(envConfig.REDIS_PORT),
  username: envConfig.REDIS_USERNAME,
  password: envConfig.REDIS_PASSWORD,
  maxRetriesPerRequest: null
};

// Initialize S3 client
const s3Client = new S3Client({
  region: envConfig.S3_REGION,
  credentials: {
    accessKeyId: envConfig.S3_ACCESS_KEY,
    secretAccessKey: envConfig.S3_SECRET_KEY
  },
  endpoint: envConfig.S3_ENDPOINT
});

// Create video processing queue
export const videoQueue = new Queue("video processing", { connection: connectionOptions });

// Create worker to process video encoding jobs
export const videoWorker = new Worker(
  "video processing",
  async (job: Job) => {
    const { videoId, videoKey } = job.data;

    try {
      // Update video status to processing
      await databaseService.videos.updateOne(
        { _id: new ObjectId(videoId) },
        {
          $set: {
            status: EncodingStatus.Processing,
            message: "Video processing started",
            updated_at: new Date()
          }
        }
      );

      // Create temporary directory for video processing
      const tempDir = path.resolve("temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate temporary file path
      const tempVideoPath = path.join(tempDir, path.basename(videoKey));

      // Download video from S3 to temporary location
      const getObjectCommand = new GetObjectCommand({
        Bucket: envConfig.S3_BUCKET_NAME,
        Key: videoKey // videoKey already includes the 'videos/' prefix
      });

      const response = await s3Client.send(getObjectCommand);
      const videoBuffer = await response.Body?.transformToByteArray();

      if (!videoBuffer) {
        throw new Error("Failed to download video from S3");
      }

      // Write video to temporary file
      await fs.promises.writeFile(tempVideoPath, Buffer.from(videoBuffer));

      // Process video with FFmpeg to create multiple resolutions
      const success = await encodeHLSWithMultipleVideoStreams(tempVideoPath);

      if (!success) {
        throw new Error("Video encoding failed");
      }

      // Upload processed video files back to S3
      // FFmpeg creates HLS files in subdirectories named v0, v1, etc. under the same parent directory
      const videoFolder = path.dirname(tempVideoPath);

      // Read all processed video files (HLS segments and playlist) from the video folder and its subdirectories
      const processFilesRecursively = (dir: string): string[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let files: string[] = [];

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            // Only process subdirectories that start with 'v' (like v0, v1, etc.) which FFmpeg creates
            if (entry.name.startsWith("v") && !isNaN(parseInt(entry.name.substring(1)))) {
              files = files.concat(processFilesRecursively(fullPath));
            }
          } else {
            files.push(fullPath);
          }
        }

        return files;
      };

      const allProcessedFiles = processFilesRecursively(videoFolder);

      // Filter only the files related to the processed video (excluding the original input file)
      const originalFileName = path.basename(tempVideoPath);
      const videoOutputFiles = allProcessedFiles.filter((file) => {
        const fileName = path.basename(file);
        // Include only HLS-related files (m3u8, ts, etc.) and exclude the original input file
        return fileName !== originalFileName && (fileName.endsWith(".m3u8") || fileName.endsWith(".ts") || fileName.includes("fileSequence"));
      });

      // Upload each processed file to S3
      for (const filePath of videoOutputFiles) {
        const fileBuffer = await fs.promises.readFile(filePath);
        const relativePath = path.relative(videoFolder, filePath);

        const uploadCommand = new PutObjectCommand({
          Bucket: envConfig.S3_BUCKET_NAME,
          Key: `videos/${path.basename(videoKey, path.extname(videoKey))}/${relativePath}`,
          Body: fileBuffer,
          ACL: "public-read"
        });

        await s3Client.send(uploadCommand);
      }

      // Clean up temporary files
      await fs.promises.rm(tempDir, { recursive: true, force: true });

      // Update video status to completed
      await databaseService.videos.updateOne(
        { _id: new ObjectId(videoId) },
        {
          $set: {
            status: EncodingStatus.Completed,
            message: "Video processed successfully",
            updated_at: new Date()
          }
        }
      );

      return { success: true, message: "Video processed successfully" };
    } catch (error) {
      console.error("Video processing error:", error);

      // Update video status to failed
      await databaseService.videos.updateOne(
        { _id: new ObjectId(videoId) },
        {
          $set: {
            status: EncodingStatus.Failed,
            message: error instanceof Error ? error.message : "Video processing failed",
            updated_at: new Date()
          }
        }
      );

      throw error;
    }
  },
  { connection: connectionOptions }
);

// Graceful shutdown
process.on("SIGTERM", async () => {
  await videoWorker.close();
});
