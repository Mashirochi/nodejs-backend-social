import { uploadSingleImageController, uploadSingleImageToS3Controller } from "@/controllers/media.controller";
import { Router } from "express";

const mediaRouter = Router();

// mediaRouter.post("/image", uploadSingleImageController);
mediaRouter.post("/image", uploadSingleImageToS3Controller);

export default mediaRouter;
