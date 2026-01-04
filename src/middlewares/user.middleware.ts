import { TokenPayload } from "@/models/validates/auth.zod";
import { UserVerifyStatus } from "@/models/validates/user.zod";
import { ErrorWithStatus } from "@/utils/errors";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  // bug
  const { verify } = req.decoded_authorization as TokenPayload;
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: "User is not verified",
        status: StatusCodes.FORBIDDEN
      })
    );
  }
  next();
};
