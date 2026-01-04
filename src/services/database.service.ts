import RefreshToken from "@/models/schemas/refresh-token.schema";
import User from "@/models/schemas/user.schema";
import { MongoClient, Collection, Db } from "mongodb";

const uri = process.env.MONGO_URI || "";
class DatabaseService {
  private client: MongoClient;
  private db: Db;
  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(process.env.DB_NAME);
  }

  async connect() {
    try {
      console.log(process.env.MONGO_URI);
      // Send a ping to confirm a successful connection
      await this.client.db(process.env.DB_NAME).command({ ping: 1 });
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
}

const databaseService = new DatabaseService();

export default databaseService;
