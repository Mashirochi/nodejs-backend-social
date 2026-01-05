import { TokenType, UserVerifyStatus } from "@/models/validates/user.zod";
import { signToken } from "@/utils/jwt";
import envConfig from "@/utils/validateEnv";

export class JwtService {
  private signAccessToken(user_id: string, verify: UserVerifyStatus = UserVerifyStatus.Unverified) {
    return signToken()({
      payload: {
        user_id,
        verify,
        token_type: TokenType.AccessToken
      },
      privateKey: envConfig.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN ? parseInt(envConfig.ACCESS_TOKEN_EXPIRES_IN, 10) : undefined
      }
    });
  }

  private signRefreshToken(user_id: string) {
    return signToken()({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken
      },
      privateKey: envConfig.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: Number(envConfig.REFRESH_TOKEN_EXPIRES_IN)
      }
    });
  }

  private signEmailVerifyToken(user_id: string) {
    return signToken()({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken
      },
      privateKey: envConfig.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: Number(envConfig.EMAIL_VERIFY_TOKEN_EXPIRES_IN)
      }
    });
  }

  private signAccessAndRefreshToken(user_id: string, verify: UserVerifyStatus = UserVerifyStatus.Unverified) {
    return Promise.all([this.signAccessToken(user_id, verify), this.signRefreshToken(user_id)]);
  }

  private signForgotPasswordToken(user_id: string) {
    return signToken()({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken
      },
      privateKey: envConfig.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: Number(envConfig.EMAIL_VERIFY_TOKEN_EXPIRES_IN)
      }
    });
  }

  async generateAccessToken(user_id: string, verify: UserVerifyStatus = UserVerifyStatus.Unverified) {
    return this.signAccessToken(user_id, verify);
  }

  async generateRefreshToken(user_id: string) {
    return this.signRefreshToken(user_id);
  }

  async generateEmailVerifyToken(user_id: string) {
    return this.signEmailVerifyToken(user_id);
  }

  async generateAccessAndRefreshTokens(user_id: string, verify: UserVerifyStatus = UserVerifyStatus.Unverified) {
    return this.signAccessAndRefreshToken(user_id, verify);
  }

  async generateForgotPasswordToken(user_id: string) {
    return this.signForgotPasswordToken(user_id);
  }
}

export const jwtService = new JwtService();
