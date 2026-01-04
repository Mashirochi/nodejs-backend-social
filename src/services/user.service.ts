import { ObjectId } from "mongodb";
import databaseService from "./database.service";
import User from "@/models/schemas/user.schema";
import { UserType } from "@/models/validates/user.zod";
import { ErrorWithStatus } from "@/utils/errors";
import { StatusCodes } from "http-status-codes";
import Follower from "@/models/schemas/follower.schema";
import { comparePassword, hashPassword } from "@/utils/crypto";

class UserService {
  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    );
    if (!user) {
      throw new ErrorWithStatus({
        message: "User not found",
        status: StatusCodes.NOT_FOUND
      });
    }
    return user;
  }

  async changePassword(user_id: string, old_password: string, password: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
    if (!user) {
      throw new ErrorWithStatus({
        message: "User not found",
        status: StatusCodes.NOT_FOUND
      });
    }
    if (!user.password) {
      throw new ErrorWithStatus({
        message: "User password is not set",
        status: StatusCodes.UNAUTHORIZED
      });
    }
    const isMatch = await comparePassword(old_password, user.password);
    if (!isMatch) {
      throw new ErrorWithStatus({
        message: "Current password is incorrect",
        status: StatusCodes.UNAUTHORIZED
      });
    }

    const newPassword = await hashPassword(password);
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { password: newPassword },
        $currentDate: {
          updated_at: true
        }
      }
    );

    return true;
  }

  async updateMe(user_id: string, updateData: Partial<UserType>) {
    // Define fields that are NOT allowed to be updated
    const restrictedFields = ["password", "email", "email_verify_token", "forgot_password_token", "verify", "created_at", "_id"];

    // Filter out restricted fields
    const filteredUpdateData: Partial<UserType> = {};

    for (const [key, value] of Object.entries(updateData)) {
      if (!restrictedFields.includes(key)) {
        (filteredUpdateData as any)[key] = value;
      }
    }

    // Check if username is being updated and ensure it's unique
    if (filteredUpdateData.username) {
      const existingUser = await databaseService.users.findOne({
        username: filteredUpdateData.username,
        _id: { $ne: new ObjectId(user_id) } // Exclude current user from check
      });

      if (existingUser) {
        throw new ErrorWithStatus({
          message: "Username already exists",
          status: StatusCodes.CONFLICT
        });
      }
    }

    filteredUpdateData.updated_at = new Date();

    const result = await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, { $set: filteredUpdateData });

    return result;
  }

  async follow(user_id: string, followed_user_id: string) {
    if (user_id === followed_user_id) {
      throw new ErrorWithStatus({
        message: "Cannot follow yourself",
        status: StatusCodes.BAD_REQUEST
      });
    }

    // Check if the followed user exists
    const followedUser = await databaseService.users.findOne({
      _id: new ObjectId(followed_user_id)
    });

    if (!followedUser) {
      throw new ErrorWithStatus({
        message: "User not found",
        status: StatusCodes.NOT_FOUND
      });
    }

    // Check if the follow relationship already exists
    const existingFollow = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });

    if (existingFollow) {
      throw new ErrorWithStatus({
        message: "Already following this user",
        status: StatusCodes.CONFLICT
      });
    }

    // Create the follow relationship
    const result = await databaseService.followers.insertOne(
      new Follower({
        user_id: new ObjectId(user_id),
        followed_user_id: new ObjectId(followed_user_id)
      })
    );

    return result;
  }

  async unfollow(user_id: string, followed_user_id: string) {
    // Check if user is trying to unfollow themselves
    if (user_id === followed_user_id) {
      throw new ErrorWithStatus({
        message: "Cannot unfollow yourself",
        status: StatusCodes.BAD_REQUEST
      });
    }

    // Delete the follow relationship
    const result = await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });

    if (result.deletedCount === 0) {
      throw new ErrorWithStatus({
        message: "Not following this user",
        status: StatusCodes.NOT_FOUND
      });
    }

    return result;
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    );
    return user;
  }
}

const userService = new UserService();
export default userService;
