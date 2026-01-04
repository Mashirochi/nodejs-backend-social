import {
  emailVerifyValidator,
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController
} from "@/controllers/auth.controller";
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  validateSchema
} from "@/middlewares/auth.middleware";
import { loginReqBodySchema, registerReqBodySchema, verifyEmailReqBodySchema, forgotPasswordReqBodySchema, logoutReqBodySchema, resetPasswordReqBodySchema } from "@/models/schemas/auth.zod";
import { wrapRequestHandler } from "@/utils/handler";
import { ResponseMessage } from "@/utils/response-message";
import { Router } from "express";

const authRouter = Router();

authRouter.post("/login", ResponseMessage("Login user"), validateSchema(loginReqBodySchema), loginValidator, loginController);
authRouter.post("/register", ResponseMessage("Register a new user"), validateSchema(registerReqBodySchema), registerValidator, registerController);
authRouter.post("/verify-email", ResponseMessage("Verify email"), validateSchema(verifyEmailReqBodySchema), emailVerifyTokenValidator, wrapRequestHandler(emailVerifyValidator));
authRouter.post("/resend-verify-email", ResponseMessage("Resend verify email"), accessTokenValidator, wrapRequestHandler(resendVerifyEmailController));
authRouter.post("/forgot-password", ResponseMessage("Forgot password"), validateSchema(forgotPasswordReqBodySchema), forgotPasswordValidator, wrapRequestHandler(forgotPasswordController));
authRouter.post("/logout", ResponseMessage("Logout user"), validateSchema(logoutReqBodySchema), accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController));
authRouter.post("/reset-password", ResponseMessage("Reset password"), validateSchema(resetPasswordReqBodySchema), resetPasswordValidator, wrapRequestHandler(resetPasswordController));
authRouter.post("/reset-password", ResponseMessage("Reset password with token"), resetPasswordValidator, wrapRequestHandler(resetPasswordController));

export default authRouter;
