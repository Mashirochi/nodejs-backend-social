import { Router, Express } from "express";
import authRouter from "./auth.route";
import userRouter from "./user.route";
import mediaRouter from "./media.route";
import videoRouter from "./video.route";

const router = Router();

const AppRoute = (app: Express) => {
  router.use("/auth", authRouter);
  router.use("/users", userRouter);
  router.use("/upload", mediaRouter);
  router.use("/video", videoRouter);
  app.use("/api/v1", router);
};

export default AppRoute;
