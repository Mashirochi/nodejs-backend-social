import { TokenPayload } from "@/models/validates/auth.zod";
import userService from "@/services/user.service";
import { ErrorWithStatus } from "@/utils/errors";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const user = await userService.getMe(user_id);
  return res.send_ok("Get profile success", user);
};

export const updateMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const updateData = req.body;
  await userService.updateMe(user_id, updateData);
  const updatedUser = await userService.getMe(user_id);
  return res.send_ok("Update profile success", updatedUser);
};

export const getProfileController = async (req: Request, res: Response) => {
  const { username } = req.params;
  const user = await userService.getProfile(username);
  return res.send_ok("Get profile success", user);
};

export const changePasswordController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { old_password, password } = req.body;
  const isChanged = await userService.changePassword(user_id, old_password, password);
  return res.send_ok("Change password success");
};

export const followController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { followed_user_id } = req.body;
  await userService.follow(user_id, followed_user_id);
  return res.send_ok("Follow user success", null);
};

export const unfollowController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { followed_user_id } = req.params;
  await userService.unfollow(user_id, followed_user_id);
  return res.send_ok("Unfollow user success", null);
};
