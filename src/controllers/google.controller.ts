import { NextFunction, Request, Response } from "express";
import googleService from "@/services/google.service";
import { USERS_MESSAGES } from "@/utils/constants/message";

export const googleAuthController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        message: "Authorization code is required"
      });
    }

    const tokens = await googleService.getGoogleOAuthToken(code);
    const { access_token } = tokens;
    const googleUser = await googleService.getGoogleUser(access_token);
    const result = await googleService.handleGoogleLogin(googleUser);

    return res.send_ok(USERS_MESSAGES.EMAIL_VERIFY_SUCCESS, result);
  } catch (error) {
    next(error);
  }
};

export const getGoogleAuthURLController = async (req: Request, res: Response) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const scope = "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email";

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    return res.status(200).json({
      message: "Google auth URL generated successfully",
      data: { url: authUrl }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate Google auth URL"
    });
  }
};
