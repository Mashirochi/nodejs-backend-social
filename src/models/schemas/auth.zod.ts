import { z } from "zod";
import { TokenType } from "@/utils/constants/user.enum";

const passwordSchema = z
  .string()
  .min(6, "Password length must be from 6 to 50")
  .max(50, "Password length must be from 6 to 50")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,50}$/,
    "Password must be 6-50 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol"
  );

const isoDateSchema = z
  .string()
  .refine((v) => !isNaN(Date.parse(v)), {
    message: "Date of birth must be ISO8601 format"
  })
  .transform((v) => new Date(v).toISOString());

export const registerReqBodySchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100).trim(),
    email: z.email("Email is invalid").trim(),
    password: passwordSchema,
    confirm_password: passwordSchema,
    date_of_birth: isoDateSchema
  })
  .strict()
  .refine((data) => data.password === data.confirm_password, {
    message: "Confirm password must be the same as password",
    path: ["confirm_password"]
  });

export const loginReqBodySchema = z
  .object({
    email: z.email("Email is invalid").trim(),
    password: z.string().min(6, "Password is required")
  })
  .strict();

export const logoutReqBodySchema = z
  .object({
    refresh_token: z.string().min(1, "Refresh token is required")
  })
  .strict();

export const verifyEmailReqBodySchema = z
  .object({
    email_verify_token: z.string().min(1, "Email verify token is required")
  })
  .strict();

export const forgotPasswordReqBodySchema = z
  .object({
    email: z.email("Email is invalid").trim()
  })
  .strict();

export const resetPasswordReqBodySchema = z
  .object({
    password: passwordSchema,
    confirm_password: passwordSchema,
    forgot_password_token: z.string().min(1, "Forgot password token is required")
  })
  .strict()
  .refine((data) => data.password === data.confirm_password, {
    message: "Confirm password must be the same as password",
    path: ["confirm_password"]
  });

export const forgotPasswordTokenSchema = z.string().min(1, "Forgot password token is required");

export const tokenPayloadSchema = z.object({
  user_id: z.string(),
  token_type: z.enum(TokenType),
  iat: z.number().optional(),
  exp: z.number().optional()
});

export type RegisterReqBody = z.infer<typeof registerReqBodySchema>;
export type LoginReqBody = z.infer<typeof loginReqBodySchema>;
export type LogoutReqBody = z.infer<typeof logoutReqBodySchema>;
export type VerifyEmailReqBody = z.infer<typeof verifyEmailReqBodySchema>;
export type ForgotPasswordReqBody = z.infer<typeof forgotPasswordReqBodySchema>;
export type ResetPasswordReqBody = z.infer<typeof resetPasswordReqBodySchema>;
export type TokenPayload = z.infer<typeof tokenPayloadSchema>;
