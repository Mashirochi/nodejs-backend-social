import { ObjectId } from "mongodb";

export enum EncodingStatus {
  Pending = "pending",
  Processing = "processing",
  Completed = "completed",
  Failed = "failed"
}

export interface VideoType {
  _id?: ObjectId;
  name: string;
  status: EncodingStatus;
  message: string;
  created_at: Date;
  updated_at: Date;
}

export default class Video {
  _id?: ObjectId;
  name: string;
  status: EncodingStatus;
  message: string;
  created_at: Date;
  updated_at: Date;

  constructor(video: VideoType) {
    const now = new Date();

    this._id = video._id;
    this.name = video.name;
    this.status = video.status;
    this.message = video.message || "";
    this.created_at = video.created_at || now;
    this.updated_at = video.updated_at || now;
  }
}
