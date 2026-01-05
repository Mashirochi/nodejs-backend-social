import { uploadSingleImageController } from "@/controllers/media.controller";
import { Router } from "express";

const mediaRouter = Router();

mediaRouter.post("/image", uploadSingleImageController);

export default mediaRouter;
