import { Router } from "express";
import { uploadVideoController, uploadVideoWithEncodingController, getVideoStatusController } from "@/controllers/video.controller";

const videoRouter = Router();

// Upload video directly to S3
videoRouter.post("/upload", uploadVideoController);

// Upload video and create encoding job in queue
videoRouter.post("/", uploadVideoWithEncodingController);

// Get video processing status
videoRouter.get("/:videoId", getVideoStatusController);

export default videoRouter;
