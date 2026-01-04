import { Router, Express } from "express";
import authRouter from "./auth.route";
import userRouter from "./user.route";

const router = Router();

const AppRoute = (app: Express) => {
  router.use("/auth", authRouter);
  router.use("/users", userRouter);
  app.use("/api/v1", router);
};

export default AppRoute;
