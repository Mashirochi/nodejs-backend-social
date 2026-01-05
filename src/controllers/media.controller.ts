import MediaService from "@/services/media.service";
import { NextFunction, Request, Response } from "express";

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const processedImage = await MediaService.processImageUpload(req);
    res.status(200).json({
      message: "Image uploaded successfully",
      file: {
        name: processedImage.filename
      }
    });
  } catch (error) {
    next(error);
  }
};
