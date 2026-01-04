import { followController, getMeController, updateMeController, getProfileController, unfollowController, changePasswordController } from "@/controllers/user.controller";
import { accessTokenValidator, validateSchema } from "@/middlewares/auth.middleware";
import { verifiedUserValidator } from "@/middlewares/user.middleware";
import { wrapRequestHandler } from "@/utils/handler";
import { ResponseMessage } from "@/utils/response-message";
import { Router } from "express";
import { changePasswordReqBodySchema, updateMeReqBodySchema } from "@/models/validates/user.zod";
import { followReqBodySchema } from "@/models/validates/follower.zod";

const userRouter = Router();

userRouter.get("/me", ResponseMessage("Get me profile"), accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getMeController));
userRouter.patch("/me", ResponseMessage("Update me profile"), accessTokenValidator, validateSchema(updateMeReqBodySchema), wrapRequestHandler(updateMeController));
userRouter.get("/:username", ResponseMessage("Get user profile"), wrapRequestHandler(getProfileController));
userRouter.post("/follow", ResponseMessage("Follow user"), accessTokenValidator, validateSchema(followReqBodySchema), wrapRequestHandler(followController));
userRouter.delete("/follow/:followed_user_id", ResponseMessage("Unfollow user"), accessTokenValidator, wrapRequestHandler(unfollowController));
userRouter.put("/change-password", accessTokenValidator, validateSchema(changePasswordReqBodySchema), wrapRequestHandler(changePasswordController));

export default userRouter;
