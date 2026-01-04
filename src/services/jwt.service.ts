import { TokenType } from "@/utils/constants/user.enum";
import { signToken } from "@/utils/jwt";

export class JwtService {
  private signAccessToken(user_id: string) {
    return signToken()({
      payload: {
        user_id,
        token_type: TokenType.AccessToken
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN)
      }
    });
  }

  private signRefreshToken(user_id: string) {
    return signToken()({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN)
      }
    });
  }

  private signEmailVerifyToken(user_id: string) {
    return signToken()({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: Number(process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN)
      }
    });
  }

  private signAccessAndRefreshToken(user_id: string) {
    return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)]);
  }

  private signForgotPasswordToken(user_id: string) {
    return signToken()({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: Number(process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN)
      }
    });
  }

  async generateAccessToken(user_id: string) {
    return this.signAccessToken(user_id);
  }

  async generateRefreshToken(user_id: string) {
    return this.signRefreshToken(user_id);
  }

  async generateEmailVerifyToken(user_id: string) {
    return this.signEmailVerifyToken(user_id);
  }

  async generateAccessAndRefreshTokens(user_id: string) {
    return this.signAccessAndRefreshToken(user_id);
  }

  async generateForgotPasswordToken(user_id: string) {
    return this.signForgotPasswordToken(user_id);
  }
}

export const jwtService = new JwtService();
