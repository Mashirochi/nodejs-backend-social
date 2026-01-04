import { ObjectId } from "mongodb";
import { z } from "zod";

export interface FollowerType {
  _id?: ObjectId;
  user_id: ObjectId;
  followed_user_id: ObjectId;
  created_at?: Date;
}

export const followReqBodySchema = z
  .object({
    followed_user_id: z.string().min(1, "Followed user ID is required")
  })
  .strict();

export type FollowReqBody = z.infer<typeof followReqBodySchema>;
