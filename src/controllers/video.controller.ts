import { NextFunction, Request, Response } from "express";
import MediaService from "@/services/media.service";
import databaseService from "@/services/database.service";
import { ObjectId } from "mongodb";
import formidable from "formidable";

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await MediaService.processVideoUpload(req);

    res.status(200).json({
      message: "Video uploaded successfully",
      file: {
        url: result.url,
        key: result.key
      }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadVideoWithEncodingController = async (req: Request, res: Response, next: NextFunction) => {
  try {
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

    const result = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err: any, fields: any, files: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ fields, files });
      });
    });

    if (!result.files.video) {
      return res.status(400).json({
        message: "Video file is required"
      });
    }

    const videoFile = Array.isArray(result.files.video) ? result.files.video[0] : result.files.video;
    const resultData = await MediaService.createVideoWithEncodingJob(videoFile);

    res.status(200).json({
      message: "Video uploaded and encoding job created successfully",
      data: resultData
    });
  } catch (error) {
    next(error);
  }
};

export const getVideoStatusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { videoId } = req.params;

    // Get video from database
    const video = await databaseService.videos.findOne({ _id: new ObjectId(videoId) });

    if (!video) {
      return res.status(404).json({
        message: "Video not found"
      });
    }

    res.status(200).json({
      message: "Video status retrieved successfully",
      data: {
        videoId: video._id,
        name: video.name,
        status: video.status,
        message: video.message,
        createdAt: video.created_at,
        updatedAt: video.updated_at
      }
    });
  } catch (error) {
    next(error);
  }
};
