import { ObjectId } from "mongodb";
import { URLSearchParams } from "url";
import https from "https";
import User from "@/models/schemas/user.schema";
import databaseService from "./database.service";
import { jwtService } from "./jwt.service";
import RefreshToken from "@/models/schemas/refresh-token.schema";
import envConfig from "@/utils/validateEnv";

interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

class GoogleService {
  /**
   * Makes an HTTPS request to the given URL with the specified options
   */
  private httpsRequest(url: string, options: https.RequestOptions, postData?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      if (postData) {
        req.write(postData);
      }

      req.end();
    });
  }

  /**
   * Get Google OAuth access token using authorization code
   */
  async getGoogleOAuthToken(code: string) {
    const body = new URLSearchParams({
      code,
      client_id: envConfig.GOOGLE_CLIENT_ID,
      client_secret: envConfig.GOOGLE_CLIENT_SECRET,
      redirect_uri: envConfig.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code"
    });

    const options: https.RequestOptions = {
      hostname: "oauth2.googleapis.com",
      path: "/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": body.toString().length
      }
    };

    try {
      const data = await this.httpsRequest("https://oauth2.googleapis.com/token", options, body.toString());
      return data;
    } catch (error) {
      throw new Error("Failed to get Google OAuth token");
    }
  }

  /**
   * Get Google user profile using access token
   */
  async getGoogleUser(access_token: string) {
    const options: https.RequestOptions = {
      hostname: "www.googleapis.com",
      path: `/oauth2/v1/userinfo?access_token=${encodeURIComponent(access_token)}&alt=json`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    };

    try {
      const data = await this.httpsRequest(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${encodeURIComponent(access_token)}&alt=json`, {
        hostname: "www.googleapis.com",
        path: `/oauth2/v1/userinfo?access_token=${encodeURIComponent(access_token)}&alt=json`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });

      return data as GoogleUser;
    } catch (error) {
      throw new Error("Failed to get Google user profile");
    }
  }

  /**
   * Handle Google login process
   */
  async handleGoogleLogin(googleUser: GoogleUser) {
    // Check if user already exists with this Google ID
    const existingUser = await databaseService.users.findOne({ google_id: googleUser.id });

    if (existingUser) {
      // User already exists, return existing user's tokens
      return await this.loginAfterAuthentication(existingUser._id!.toString());
    } else {
      // Check if user exists with this email (but not Google authenticated)
      const existingUserByEmail = await databaseService.users.findOne({ email: googleUser.email });

      if (existingUserByEmail) {
        // Update existing user with Google ID
        await databaseService.users.updateOne(
          { _id: existingUserByEmail._id },
          {
            $set: {
              google_id: googleUser.id,
              avatar: googleUser.picture,
              verify: 1 // Verified since Google verified the email
            }
          }
        );

        return await this.loginAfterAuthentication(existingUserByEmail._id!.toString());
      } else {
        // Create new user
        const user_id = new ObjectId();
        const newUser = new User({
          _id: user_id,
          name: googleUser.name,
          email: googleUser.email,
          password: "", // No password for Google auth users
          date_of_birth: new Date(1900, 0, 1), // Default date
          verify: 1, // Verified since Google verified the email
          avatar: googleUser.picture,
          google_id: googleUser.id
        });

        await databaseService.users.insertOne(newUser);
        return await this.loginAfterAuthentication(user_id.toString());
      }
    }
  }

  /**
   * Login after authentication - similar to auth.service
   */
  async loginAfterAuthentication(user_id: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
    const [access_token, refresh_token] = await jwtService.generateAccessAndRefreshTokens(user_id, user?.verify || 0);
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    );
    return {
      access_token,
      refresh_token
    };
  }
}

const googleService = new GoogleService();
export default googleService;
