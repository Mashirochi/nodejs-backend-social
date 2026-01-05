import { ObjectId } from "mongodb";
import { z } from "zod";

export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export interface UserType {
  _id?: ObjectId;
  name?: string;
  email: string;
  date_of_birth?: Date;
  password: string;
  created_at?: Date;
  updated_at?: Date;
  email_verify_token?: string;
  forgot_password_token?: string;
  verify?: UserVerifyStatus;

  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  cover_photo?: string;
  google_id?: string;
}

const isoDateSchema = z
  .string()
  .refine((v) => !isNaN(Date.parse(v)), {
    message: "Date of birth must be ISO8601 format"
  })
  .transform((v) => new Date(v).toISOString());

export const updateMeReqBodySchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100).optional(),
    bio: z.string().max(200).optional(),
    location: z.string().max(100).optional(),
    website: z.string().url("Website must be a valid URL").optional(),
    username: z.string().min(3, "Username must be at least 3 characters").max(50).optional(),
    avatar: z.string().url("Avatar must be a valid URL").optional(),
    cover_photo: z.string().url("Cover photo must be a valid URL").optional(),
    date_of_birth: isoDateSchema.optional()
  })
  .strict();

export const changePasswordReqBodySchema = z
  .object({
    old_password: z.string().min(6, "Old password is required"),
    password: z.string().min(6, "Password length must be from 6 to 50").max(50),
    confirm_password: z.string().min(6, "Confirm password is required").max(50)
  })
  .strict()
  .refine((data) => data.password === data.confirm_password, {
    message: "Confirm password must be the same as password",
    path: ["confirm_password"]
  });

export type UpdateMeReqBody = z.infer<typeof updateMeReqBodySchema>;
export type ChangePasswordReqBody = z.infer<typeof changePasswordReqBodySchema>;
