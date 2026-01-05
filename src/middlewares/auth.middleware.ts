// export const requireLoginedHook = async (request: Request) => {
//   const accessToken = request.headers.authorization?.split(' ')[1]
//   if (!accessToken) throw new AuthError('Không nhận được access token')
//   try {
//     const decodedAccessToken = verifyAccessToken(accessToken)
//     request.decodedAccessToken = decodedAccessToken
//   } catch (error) {
//     throw new AuthError('Access token không hợp lệ')
//   }
// }

// export const requireOwnerHook = async (request: Request) => {
//   if (request.decodedAccessToken?.role !== Role.Owner) {
//     throw new AuthError('Bạn không có quyền truy cập')
//   }
// }

import authService from "@/services/auth.service";
import databaseService from "@/services/database.service";
import { Request, Response, NextFunction } from "express";
import { USERS_MESSAGES } from "@/utils/constants/message";
import { comparePassword, hashPassword } from "@/utils/crypto";
import { ObjectId } from "mongodb";
import { ErrorWithStatus, EntityError } from "@/utils/errors";
import { verifyToken } from "@/utils/jwt";
import { JsonWebTokenError } from "jsonwebtoken";
import { capitalize } from "lodash";
import { tokenPayloadSchema, accessTokenPayloadSchema } from "@/models/validates/auth.zod";
import { z } from "zod";
import { StatusCodes } from "http-status-codes";
import envConfig from "@/utils/validateEnv";

export const validateSchema = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, { msg: string }> = {};
        error.issues.forEach((err) => {
          const field = err.path.join(".");
          errors[field] = { msg: err.message };
        });
        const entityError = new EntityError({ errors });
        return next(entityError);
      }
      next(error);
    }
  };
};

const validateToken = async (token: string, secret: string, req: Request, tokenType: "access" | "refresh" | "email_verify" | "forgot_password") => {
  if (!token) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES[`${tokenType.toUpperCase()}_TOKEN_IS_REQUIRED` as keyof typeof USERS_MESSAGES],
      status: StatusCodes.UNAUTHORIZED
    });
  }
  try {
    const decoded_token = await verifyToken({ token, secretOrPublicKey: secret });
    // Validate token payload based on token type
    if (tokenType === "access") {
      accessTokenPayloadSchema.parse(decoded_token);
    } else {
      tokenPayloadSchema.parse(decoded_token);
    }

    switch (tokenType) {
      case "access":
        (req as Request).decoded_authorization = decoded_token;
        break;
      case "refresh":
        (req as Request).decoded_refresh_token = decoded_token;
        break;
      case "email_verify":
        (req as Request).decoded_email_verify_token = decoded_token;
        break;
      case "forgot_password":
        (req as Request).decoded_forgot_password_token = decoded_token;
        break;
    }
    return decoded_token;
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw new ErrorWithStatus({
        message: capitalize(error.message),
        status: StatusCodes.UNAUTHORIZED
      });
    } else if (error instanceof z.ZodError) {
      throw new ErrorWithStatus({
        message: "Invalid token payload",
        status: StatusCodes.UNAUTHORIZED
      });
    }
    throw error;
  }
};

const validateForgotPasswordToken = async (value: string, req: Request) => {
  if (!value) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
      status: StatusCodes.UNAUTHORIZED
    });
  }
  try {
    const decoded_forgot_password_token = await verifyToken({
      token: value,
      secretOrPublicKey: envConfig.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
    });
    const { user_id } = decoded_forgot_password_token;
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: StatusCodes.UNAUTHORIZED
      });
    }
    if (user.forgot_password_token !== value) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.INVALID_FORGOT_PASSWORD_TOKEN,
        status: StatusCodes.UNAUTHORIZED
      });
    }
    req.decoded_forgot_password_token = decoded_forgot_password_token;
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw new ErrorWithStatus({
        message: capitalize(error.message),
        status: StatusCodes.UNAUTHORIZED
      });
    }
    throw error;
  }
};

export const loginValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user = await databaseService.users.findOne({
      email
    });

    const isCorrectPassword = user ? await comparePassword(password, user.password) : false;

    if (user === null || !isCorrectPassword) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT,
        status: StatusCodes.UNAUTHORIZED
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    next(error);
  }
};
export const registerValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const isExistEmail = await authService.checkEmailExist(email);
    if (isExistEmail) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS,
        status: 403
      });
    }

    return next();
  } catch (error) {
    next(error);
  }
};
export const accessTokenValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const access_token = (authHeader || "").split(" ")[1];

    if (!access_token) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
        status: StatusCodes.UNAUTHORIZED
      });
    }

    await validateToken(access_token, envConfig.JWT_SECRET_ACCESS_TOKEN as string, req, "access");

    return next();
  } catch (error) {
    next(error);
  }
};
export const refreshTokenValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refresh_token = req.body.refresh_token;

    if (!refresh_token) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
        status: StatusCodes.UNAUTHORIZED
      });
    }

    // Validate JWT and check if token exists in database
    const [decoded_refresh_token, tokenFromDB] = await Promise.all([
      verifyToken({ token: refresh_token, secretOrPublicKey: envConfig.JWT_SECRET_REFRESH_TOKEN as string }),
      databaseService.refreshTokens.findOne({ token: refresh_token })
    ]);

    if (tokenFromDB === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
        status: StatusCodes.UNAUTHORIZED
      });
    }

    req.decoded_refresh_token = decoded_refresh_token;

    return next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw new ErrorWithStatus({
        message: capitalize(error.message),
        status: StatusCodes.UNAUTHORIZED
      });
    }
    next(error);
  }
};
export const emailVerifyTokenValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email_verify_token = req.body.email_verify_token;

    if (!email_verify_token) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
        status: StatusCodes.UNAUTHORIZED
      });
    }

    await validateToken(email_verify_token, envConfig.JWT_SECRET_EMAIL_VERIFY_TOKEN as string, req, "email_verify");

    return next();
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await databaseService.users.findOne({ email });

    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: StatusCodes.NOT_FOUND
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    next(error);
  }
};
export const verifyForgotPasswordTokenValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { forgot_password_token } = req.body;
    await validateForgotPasswordToken(forgot_password_token, req);
    return next();
  } catch (error) {
    next(error);
  }
};
export const resetPasswordValidator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { forgot_password_token } = req.body;
    await validateForgotPasswordToken(forgot_password_token, req);
    return next();
  } catch (error) {
    next(error);
  }
};
