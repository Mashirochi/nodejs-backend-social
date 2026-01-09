import formidable from "formidable";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { Request } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import envConfig from "@/utils/validateEnv";
import Video, { EncodingStatus } from "@/models/schemas/video.schema";
import { videoQueue } from "./video.queue";
import { ObjectId } from "mongodb";
import databaseService from "./database.service";

class MediaService {
  uploadFolderPath = path.resolve("uploads");
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: envConfig.S3_REGION,
      credentials: {
        accessKeyId: envConfig.S3_ACCESS_KEY,
        secretAccessKey: envConfig.S3_SECRET_KEY
      },
      endpoint: envConfig.S3_ENDPOINT // For Vietnix S3-compatible storage
    });
  }

  async uploadToS3(file: formidable.File, maxSize = 10 * 1024 * 1024): Promise<{ url: string }> {
    // Validate file size
    if (file.size > maxSize) {
      throw new Error("File size exceeds the maximum allowed size");
    }

    // Process image with sharp
    const processedImageBuffer = await sharp(file.filepath)
      .resize(800, 600, {
        fit: "inside",
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Generate unique filename
    const ext = path.extname(file.originalFilename || "");
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    // Upload to S3 with public-read ACL
    const command = new PutObjectCommand({
      Bucket: envConfig.S3_BUCKET_NAME,
      Key: filename,
      Body: processedImageBuffer,
      ContentType: "image/jpeg", // Set appropriate content type
      ACL: "public-read", // Set ACL to public-read as requested
      Metadata: {
        originalname: file.originalFilename || ""
      }
    });

    await this.s3Client.send(command);

    // Return the public URL
    const url = `${envConfig.S3_ENDPOINT}/${envConfig.S3_BUCKET_NAME}/${filename}`;

    return { url };
  }

  async uploadAndProcessImage(file: formidable.File, maxSize = 10 * 1024 * 1024, useS3 = false) {
    if (useS3) {
      return await this.uploadToS3(file, maxSize);
    }

    // Create uploads folder if it doesn't exist
    if (!fs.existsSync(this.uploadFolderPath)) {
      fs.mkdirSync(this.uploadFolderPath, { recursive: true });
    }

    // Validate file size
    if (file.size > maxSize) {
      throw new Error("File size exceeds the maximum allowed size");
    }

    // Process image with sharp
    const processedImageBuffer = await sharp(file.filepath)
      .resize(800, 600, {
        fit: "inside",
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Generate unique filename
    const ext = path.extname(file.originalFilename || "");
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const processedImagePath = path.join(this.uploadFolderPath, filename);

    // Save processed image
    await fs.promises.writeFile(processedImagePath, processedImageBuffer);

    // Remove original temp file
    await fs.promises.unlink(file.filepath);

    return { filename };
  }

  validateImageFile(file: formidable.File): boolean {
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalFilename || "").toLowerCase();

    return validExtensions.includes(ext) && Boolean(file.mimetype?.startsWith("image/"));
  }

  validateVideoFile(file: formidable.File): boolean {
    const validExtensions = [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv", ".m4v"];
    const ext = path.extname(file.originalFilename || "").toLowerCase();

    return validExtensions.includes(ext) && Boolean(file.mimetype?.startsWith("video/"));
  }

  async uploadVideoToS3(file: formidable.File, maxSize = 50 * 1024 * 1024): Promise<{ url: string; key: string }> {
    // Validate file size (50MB max for videos)
    if (file.size > maxSize) {
      throw new Error("Video file size exceeds the maximum allowed size");
    }

    // Validate video file
    if (!this.validateVideoFile(file)) {
      throw new Error("Invalid video file type");
    }

    // Generate unique filename
    const ext = path.extname(file.originalFilename || "");
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const videoKey = `videos/${filename}`;

    // Read the video file
    const videoBuffer = await fs.promises.readFile(file.filepath);

    // Upload to S3 with public-read ACL
    const command = new PutObjectCommand({
      Bucket: envConfig.S3_BUCKET_NAME,
      Key: videoKey,
      Body: videoBuffer,
      ContentType: file.mimetype || "video/mp4",
      ACL: "public-read", // Set ACL to public-read as requested
      Metadata: {
        originalname: file.originalFilename || ""
      }
    });

    await this.s3Client.send(command);

    // Return the public URL
    const url = `${envConfig.S3_ENDPOINT}/${envConfig.S3_BUCKET_NAME}/${videoKey}`;

    return { url, key: videoKey };
  }

  async processVideoUpload(req: Request): Promise<{ url: string; key: string }> {
    return new Promise((resolve, reject) => {
      const form = formidable({
        maxFiles: 1,
        keepExtensions: true,
        maxFileSize: 50 * 1024 * 1024, // 50MB for videos
        filter: function (part: formidable.Part) {
          const valid = part.name === "video" && Boolean(part.mimetype?.includes("video/"));
          if (!valid) {
            form.emit("error" as any, new Error("File type is not valid") as any);
          }
          return valid;
        }
      });

      form.parse(req, async (err: any, fields: any, files: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (!Boolean(files.video)) {
          reject(new Error("Video file is empty"));
          return;
        }

        try {
          const videoFile = Array.isArray(files.video) ? files.video[0] : files.video;

          if (!this.validateVideoFile(videoFile)) {
            reject(new Error("File type is not valid"));
            return;
          }

          const uploadedVideo = await this.uploadVideoToS3(videoFile);
          resolve(uploadedVideo);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async createVideoWithEncodingJob(videoFile: formidable.File) {
    // Upload video to S3
    const uploadedVideo = await this.uploadVideoToS3(videoFile);

    // Create video record in database with pending status
    const videoId = new ObjectId();
    const video = new Video({
      _id: videoId,
      name: videoFile.originalFilename || "untitled",
      status: EncodingStatus.Pending,
      message: "Video upload completed, waiting for processing",
      created_at: new Date(),
      updated_at: new Date()
    });

    await databaseService.videos.insertOne(video);

    // Add video processing job to queue
    await videoQueue.add("process video", {
      videoId: videoId.toString(),
      videoKey: uploadedVideo.key
    });

    return {
      videoId: videoId.toString(),
      name: video.name,
      status: video.status,
      message: video.message,
      url: uploadedVideo.url
    };
  }

  async processImageUpload(req: Request, useS3 = false): Promise<{ filename: string } | { url: string }> {
    return new Promise((resolve, reject) => {
      const form = formidable({
        maxFiles: 1,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        filter: function (part: formidable.Part) {
          const valid = part.name === "image" && Boolean(part.mimetype?.includes("image/"));
          if (!valid) {
            form.emit("error" as any, new Error("File type is not valid") as any);
          }
          return valid;
        }
      });

      form.parse(req, async (err: any, fields: any, files: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (!Boolean(files.image)) {
          reject(new Error("File is empty"));
          return;
        }

        try {
          const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

          if (!this.validateImageFile(imageFile)) {
            reject(new Error("File type is not valid"));
            return;
          }

          const processedImage = await this.uploadAndProcessImage(imageFile, 10 * 1024 * 1024, useS3);
          resolve(processedImage);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

export default new MediaService();
