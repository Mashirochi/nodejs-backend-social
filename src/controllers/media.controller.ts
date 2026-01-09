import MediaService from "@/services/media.service";
import { NextFunction, Request, Response } from "express";

// Controller for local file upload
export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const processedImage = await MediaService.processImageUpload(req, false); // Local upload

    // Type guard to check if it's a local upload result
    if ("filename" in processedImage) {
      res.status(200).json({
        message: "Image uploaded successfully",
        file: {
          name: processedImage.filename
        }
      });
    } else {
      // This shouldn't happen with useS3 = false, but just in case
      res.status(200).json({
        message: "Image uploaded successfully",
        file: {
          url: processedImage.url
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// Controller for S3 file upload
export const uploadSingleImageToS3Controller = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const processedImage = await MediaService.processImageUpload(req, true); // S3 upload

    // Type guard to check if it's an S3 upload result
    if ("url" in processedImage) {
      res.status(200).json({
        message: "Image uploaded to S3 successfully",
        file: {
          url: processedImage.url
        }
      });
    } else {
      // This shouldn't happen with useS3 = true, but just in case
      res.status(200).json({
        message: "Image uploaded successfully",
        file: {
          name: processedImage.filename
        }
      });
    }
  } catch (error) {
    next(error);
  }
};
