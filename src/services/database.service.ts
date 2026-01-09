import Follower from "@/models/schemas/follower.schema";
import RefreshToken from "@/models/schemas/refresh-token.schema";
import User from "@/models/schemas/user.schema";
import Video from "@/models/schemas/video.schema";
import envConfig from "@/utils/validateEnv";
import { MongoClient, Collection, Db } from "mongodb";
import { createClient } from "redis";

const uri = envConfig.MONGO_URI || "";
class DatabaseService {
  private client: MongoClient;
  private db: Db;
  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(envConfig.DB_NAME);
  }

  async connectToRedis() {
    const client = createClient({
      username: envConfig.REDIS_USERNAME,
      password: envConfig.REDIS_PASSWORD,
      socket: {
        host: envConfig.REDIS_HOST,
        port: parseInt(envConfig.REDIS_PORT)
      }
    });

    client.on("error", (err) => console.log("Redis Client Error", err));

    await client.connect();

    console.log("Connected to Redis successfully");
  }

  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.client.db(envConfig.DB_NAME).command({ ping: 1 });
      console.log("Connected successfully to server");
    } catch (error) {
      console.log("Error", error);
      throw error;
    }
  }
  get users(): Collection<User> {
    return this.db.collection("users");
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection("refresh_tokens");
  }

  get followers(): Collection<Follower> {
    return this.db.collection("followers");
  }

  get videos(): Collection<Video> {
    return this.db.collection("videos");
  }
}

const databaseService = new DatabaseService();

export default databaseService;
