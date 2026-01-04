import User from "@/models/schemas/user.schema";
import databaseService from "./database.service";
import { TokenType, UserVerifyStatus } from "@/models/validates/user.zod";
import { USERS_MESSAGES } from "@/utils/constants/message";
import { ObjectId } from "mongodb";
import RefreshToken from "@/models/schemas/refresh-token.schema";
import { hashPassword } from "@/utils/crypto";
import { jwtService } from "./jwt.service";
import { RegisterReqBody } from "@/models/validates/auth.zod";

class AuthService {
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId();
    const email_verify_token = await jwtService.generateEmailVerifyToken(user_id.toString());
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verify_token,
        date_of_birth: new Date(payload.date_of_birth),
        password: await hashPassword(payload.password)
      })
    );
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
    const [access_token, refresh_token] = await jwtService.generateAccessAndRefreshTokens(user_id.toString(), user?.verify || UserVerifyStatus.Unverified);
    await databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token }));
    console.log("email_verify_token: ", email_verify_token);
    return {
      access_token,
      refresh_token
    };
  }

  async loginAfterAuthentication(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
    const [access_token, refresh_token] = await jwtService.generateAccessAndRefreshTokens(user_id, user?.verify || UserVerifyStatus.Unverified);
    await databaseService.refreshTokens.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token }));
    return {
      access_token,
      refresh_token
    };
  }

  async logout(refresh_token: string) {
    const result = await databaseService.refreshTokens.deleteOne({ token: refresh_token });
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    };
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email });
    return Boolean(user);
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      await jwtService.generateAccessAndRefreshTokens(user_id, UserVerifyStatus.Verified),
      databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
        {
          $set: {
            email_verify_token: "",
            verify: UserVerifyStatus.Verified,
            updated_at: "$$NOW"
          }
        }
      ])
    ]);
    const [access_token, refresh_token] = token;
    return {
      access_token,
      refresh_token
    };
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await jwtService.generateEmailVerifyToken(user_id);
    // add resend email
    console.log("Rensend verify email: ", email_verify_token);

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    );
    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    };
  }

  async forgotPassword(user_id: string) {
    const forgot_password_token = await jwtService.generateForgotPasswordToken(user_id);
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          forgot_password_token,
          updated_at: "$$NOW"
        }
      }
    ]);
    console.log("forgot_password_token: ", forgot_password_token);
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    };
  }

  async resetPassword(user_id: string, password: string) {
    databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: "",
          password: await hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    );
    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    };
  }
}

const authService = new AuthService();
export default authService;
