import User from "@/models/schemas/user.schema";
import { USERS_MESSAGES } from "@/utils/constants/message";
import { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { ParamsDictionary } from "express-serve-static-core";
import { ForgotPasswordReqBody, LogoutReqBody, RegisterReqBody, ResetPasswordReqBody, TokenPayload } from "@/models/validates/auth.zod";
import databaseService from "@/services/database.service";
import { UserVerifyStatus } from "@/models/validates/user.zod";
import authService from "@/services/auth.service";

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User;
  const user_id = user._id as ObjectId;
  const result = await authService.loginAfterAuthentication(user_id.toString());
  return res.send_ok(USERS_MESSAGES.LOGIN_SUCCESS, result);
};

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response, next: NextFunction) => {
  const result = await authService.register(req.body);
  return res.send_created(USERS_MESSAGES.REGISTER_SUCCESS, result);
};

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body;
  const result = await authService.logout(refresh_token);
  return res.send_ok(USERS_MESSAGES.LOGOUT_SUCCESS, result);
};

export const emailVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload;
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  });
  if (!user) {
    return res.send_notFound(USERS_MESSAGES.USER_NOT_FOUND);
  }
  // Đã verify rồi thì mình sẽ không báo lỗi
  // Mà mình sẽ trả về status OK với message là đã verify trước đó rồi
  if (user.email_verify_token === "") {
    return res.send_ok(USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE);
  }
  const result = await authService.verifyEmail(user_id);
  return res.send_ok(USERS_MESSAGES.EMAIL_VERIFY_SUCCESS, result);
};

export const resendVerifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
  if (!user) {
    return res.send_notFound(USERS_MESSAGES.USER_NOT_FOUND);
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.send_ok(USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE);
  }
  const result = await authService.resendVerifyEmail(user_id);
  return res.send_ok(USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS, result);
};

export const forgotPasswordController = async (req: Request<ParamsDictionary, any, ForgotPasswordReqBody>, res: Response, next: NextFunction) => {
  const { _id } = req.user as User;
  const result = await authService.forgotPassword((_id as ObjectId).toString());
  return res.send_ok(USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD, result);
};

export const resetPasswordController = async (req: Request<ParamsDictionary, any, ResetPasswordReqBody>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload;
  const { password } = req.body;
  const result = await authService.resetPassword(user_id, password);
  return res.send_ok(USERS_MESSAGES.RESET_PASSWORD_SUCCESS, result);
};
