import { ObjectId } from "mongodb";
import { UserType, UserVerifyStatus } from "@/models/validates/user.zod";
export default class User {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
  date_of_birth: Date;
  created_at: Date;
  updated_at: Date;
  email_verify_token: string;
  forgot_password_token: string;
  verify: UserVerifyStatus;
  bio: string;
  location: string;
  website: string;
  username: string;
  avatar: string;
  cover_photo: string;
  google_id?: string;

  constructor(user: UserType) {
    const now = new Date();

    this._id = user._id;
    this.name = user.name ?? "";
    this.email = user.email;
    this.password = user.password;

    this.date_of_birth = user.date_of_birth ?? new Date(0);
    this.created_at = user.created_at ?? now;
    this.updated_at = user.updated_at ?? now;

    this.email_verify_token = user.email_verify_token ?? "";
    this.forgot_password_token = user.forgot_password_token ?? "";
    this.verify = user.verify ?? UserVerifyStatus.Unverified;

    this.bio = user.bio ?? "";
    this.location = user.location ?? "";
    this.website = user.website ?? "";
    this.username = user.username ?? "";
    this.avatar = user.avatar ?? "";
    this.cover_photo = user.cover_photo ?? "";
  }
}
