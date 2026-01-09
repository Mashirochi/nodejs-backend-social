import {
  emailVerifyController,
  forgotPasswordController,
  loginController,
  logoutController,
  registerController,
  refreshTokenController,
  resendVerifyEmailController,
  resetPasswordController
} from "@/controllers/auth.controller";
import { getGoogleAuthURLController, googleAuthController } from "@/controllers/google.controller";
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
import { loginReqBodySchema, registerReqBodySchema, verifyEmailReqBodySchema, forgotPasswordReqBodySchema, logoutReqBodySchema, resetPasswordReqBodySchema } from "@/models/validates/auth.zod";
import { wrapRequestHandler } from "@/utils/handler";
import { ResponseMessage } from "@/utils/response-message";
import { Router } from "express";

const authRouter = Router();

authRouter.post("/login", ResponseMessage("Login user"), validateSchema(loginReqBodySchema), loginValidator, loginController);
authRouter.post("/register", ResponseMessage("Register a new user"), validateSchema(registerReqBodySchema), registerValidator, registerController);
authRouter.post("/verify-email", ResponseMessage("Verify email"), validateSchema(verifyEmailReqBodySchema), emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController));
authRouter.post("/resend-verify-email", ResponseMessage("Resend verify email"), accessTokenValidator, wrapRequestHandler(resendVerifyEmailController));
authRouter.post("/forgot-password", ResponseMessage("Forgot password"), validateSchema(forgotPasswordReqBodySchema), forgotPasswordValidator, wrapRequestHandler(forgotPasswordController));
authRouter.post("/logout", ResponseMessage("Logout user"), validateSchema(logoutReqBodySchema), accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController));
authRouter.post("/reset-password", ResponseMessage("Reset password"), validateSchema(resetPasswordReqBodySchema), resetPasswordValidator, wrapRequestHandler(resetPasswordController));
authRouter.post("/refresh-token", ResponseMessage("Refresh token"), validateSchema(logoutReqBodySchema), refreshTokenValidator, wrapRequestHandler(refreshTokenController));

// Google OAuth routes
authRouter.get("/google/auth-url", ResponseMessage("Get Google auth URL"), wrapRequestHandler(getGoogleAuthURLController));
authRouter.get("/oauth/google", ResponseMessage("Google OAuth callback"), wrapRequestHandler(googleAuthController));

export default authRouter;
