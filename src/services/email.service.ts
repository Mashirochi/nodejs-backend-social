import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import envConfig from "../utils/validateEnv";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: envConfig.GOOGLE_HOST,
      port: envConfig.GOOGLE_PORT,
      secure: true, // true for 465, false for other ports
      auth: {
        user: envConfig.GOOGLE_SENDER_EMAIL,
        pass: envConfig.GOOGLE_APP_PASSWORD
      }
    });
  }

  public async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const { email, subject, template, data } = options;

      // Read the template file
      // First try the dist directory (for compiled code)
      let templatePath = path.join(__dirname, "..", "..", "templates", "emails", template);

      // If the template doesn't exist in dist, try src directory (for development)
      if (!fs.existsSync(templatePath)) {
        templatePath = path.join(__dirname, "..", "templates", "emails", template);
      }

      const templateSource = fs.readFileSync(templatePath, "utf8");

      // Compile the template
      const compiledTemplate = handlebars.compile(templateSource);
      const html = compiledTemplate(data);

      // Define the mail options
      const mailOptions = {
        from: envConfig.GOOGLE_SENDER_EMAIL,
        to: email,
        subject,
        html
      };

      // Send the email
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }

  // Method to send verification email
  public async sendVerificationEmail(email: string, verificationLink: string): Promise<void> {
    const options: EmailOptions = {
      email,
      subject: "Email Verification",
      template: "verification-email.hbs",
      data: {
        verificationLink,
        email
      }
    };

    await this.sendEmail(options);
  }

  // Method to send forgot password email
  public async sendForgotPasswordEmail(email: string, resetLink: string): Promise<void> {
    const options: EmailOptions = {
      email,
      subject: "Password Reset Request",
      template: "forgot-password.hbs",
      data: {
        resetLink,
        email
      }
    };

    await this.sendEmail(options);
  }

  // Method to send welcome email
  public async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    const options: EmailOptions = {
      email,
      subject: "Welcome to Our Platform!",
      template: "welcome-email.hbs",
      data: {
        userName,
        email
      }
    };

    await this.sendEmail(options);
  }
}

export default new EmailService();
