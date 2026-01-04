import { emailVerifyValidator, loginController, registerController, resendVerifyEmailController } from "@/controllers/user.controller";
import { accessTokenValidator, emailVerifyTokenValidator, loginValidator, registerValidator } from "@/middlewares/user.middleware";
import { wrapRequestHandler } from "@/utils/handler";
import { Router } from "express";

const userRoute = Router();

userRoute.post("/login", loginValidator, loginController);
userRoute.post("/register", registerValidator, registerController);
userRoute.post("/verify-email", emailVerifyTokenValidator, wrapRequestHandler(emailVerifyValidator));
userRoute.post("/resend-verify-email", accessTokenValidator, wrapRequestHandler(resendVerifyEmailController));

export default userRoute;
