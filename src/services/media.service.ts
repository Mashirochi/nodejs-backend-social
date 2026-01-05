import formidable from "formidable";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { Request } from "express";

class MediaService {
  uploadFolderPath = path.resolve("uploads");

  async uploadAndProcessImage(file: formidable.File, maxSize = 10 * 1024 * 1024) {
    // Create uploads folder if it doesn't exist
    if (!fs.existsSync(this.uploadFolderPath)) {
      fs.mkdirSync(this.uploadFolderPath, { recursive: true });
    }

    // Validate file size
    if (file.size > maxSize) {
      throw new Error("File size exceeds the maximum allowed size");
    }

    // Process image with sharp
    const processedImageBuffer = await sharp(file.filepath)
      .resize(800, 600, {
        fit: "inside",
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Generate unique filename
    const ext = path.extname(file.originalFilename || "");
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const processedImagePath = path.join(this.uploadFolderPath, filename);

    // Save processed image
    await fs.promises.writeFile(processedImagePath, processedImageBuffer);

    // Remove original temp file
    await fs.promises.unlink(file.filepath);

    return { filename };
  }

  validateImageFile(file: formidable.File): boolean {
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalFilename || "").toLowerCase();

    return validExtensions.includes(ext) && Boolean(file.mimetype?.startsWith("image/"));
  }

  async processImageUpload(req: Request): Promise<{ filename: string }> {
    return new Promise((resolve, reject) => {
      const form = formidable({
        maxFiles: 1,
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        filter: function (part: formidable.Part) {
          const valid = part.name === "image" && Boolean(part.mimetype?.includes("image/"));
          if (!valid) {
            form.emit("error" as any, new Error("File type is not valid") as any);
          }
          return valid;
        }
      });

      form.parse(req, async (err: any, fields: any, files: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (!Boolean(files.image)) {
          reject(new Error("File is empty"));
          return;
        }

        try {
          const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

          if (!this.validateImageFile(imageFile)) {
            reject(new Error("File type is not valid"));
            return;
          }

          const processedImage = await this.uploadAndProcessImage(imageFile);
          resolve(processedImage);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}

export default new MediaService();
