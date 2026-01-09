import path from "path";
import { spawn } from "child_process";
import slash from "slash";

const MAXIMUM_BITRATE_144P = 500 * 10 ** 3; // 500kbps
const MAXIMUM_BITRATE_360P = 1 * 10 ** 6; // 1Mbps
const MAXIMUM_BITRATE_720P = 5 * 10 ** 6; // 5Mbps
const MAXIMUM_BITRATE_1080P = 8 * 10 ** 6; // 8Mbps
const MAXIMUM_BITRATE_1440P = 16 * 10 ** 6; // 16Mbps
const MAXIMUM_BITRATE_4K = 40 * 10 ** 6; // 40Mbps

// Execute command using spawn
const executeCommand = (command: string, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const child = spawn(command, args);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code || 0
      });
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
};

// Checks if the video has an audio stream
export const checkVideoHasAudio = async (filePath: string) => {
  const args = ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=codec_type", "-of", "csv=p=0", slash(filePath)];
  const result = await executeCommand("ffprobe", args);
  return result.stdout.trim() === "audio";
};

const encodeMax360 = async ({ bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution }: EncodeByResolution) => {
  const args = ["-y", "-i", slash(inputPath), "-preset", "veryslow", "-g", "48", "-crf", "17", "-sc_threshold", "0"];

  // Video stream
  args.push(
    "-s:v:0",
    `${getWidth(360, resolution)}x360`, // Set resolution to 360p
    "-c:v:0",
    "libx264",
    "-b:v:0",
    `${bitrate[360]}`,
    "-c:a:0",
    "aac",
    "-b:a:0",
    "128k"
  );

  // HLS output settings
  args.push(
    "-f",
    "hls",
    "-hls_time",
    "6",
    "-hls_list_size",
    "0",
    "-hls_playlist_type",
    "event",
    "-hls_segment_filename",
    slash(outputSegmentPath),
    "-master_pl_name",
    "master.m3u8",
    slash(outputPath)
  );

  const result = await executeCommand("ffmpeg", args);
  if (result.exitCode !== 0) {
    throw new Error(`FFmpeg failed: ${result.stderr}`);
  }
  return true;
};

// Retrieves the bitrate of the video
const getBitrate = async (filePath: string) => {
  const args = ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=bit_rate", "-of", "csv=p=0", slash(filePath)];
  const result = await executeCommand("ffprobe", args);
  const bitrate = result.stdout.trim();
  return bitrate ? Number(bitrate) : 0; // Return 0 if bitrate is not available
};

// Retrieves the resolution (width and height) of the video
const getResolution = async (filePath: string) => {
  const args = ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=s=x:p=0", slash(filePath)];
  const result = await executeCommand("ffprobe", args);
  const resolution = result.stdout.trim().split("x");
  if (resolution.length < 2) {
    throw new Error("Could not determine video resolution");
  }
  const [width, height] = resolution;
  return {
    width: Number(width),
    height: Number(height)
  };
};

// Calculates the width based on height (to keep aspect ratio intact)
const getWidth = (height: number, resolution: { width: number; height: number }) => {
  const width = Math.round((height * resolution.width) / resolution.height);
  return width % 2 === 0 ? width : width + 1;
};

type EncodeByResolution = {
  inputPath: string;
  isHasAudio: boolean;
  resolution: {
    width: number;
    height: number;
  };
  outputSegmentPath: string;
  outputPath: string;
  bitrate: {
    144: number;
    360: number;
    720: number;
    1080: number;
    1440: number;
    2160: number;
    original: number;
  };
};

const encodeMax144 = async ({ bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution }: EncodeByResolution) => {
  const args = ["-y", "-i", slash(inputPath), "-preset", "veryslow", "-g", "48", "-crf", "17", "-sc_threshold", "0"];

  // Video stream
  args.push(
    "-s:v:0",
    `${getWidth(144, resolution)}x144`, // Set resolution to 144p
    "-c:v:0",
    "libx264",
    "-b:v:0",
    `${bitrate[144]}`,
    "-c:a:0",
    "aac",
    "-b:a:0",
    "128k"
  );

  // HLS output settings
  args.push(
    "-f",
    "hls",
    "-hls_time",
    "6",
    "-hls_list_size",
    "0",
    "-hls_playlist_type",
    "event",
    "-hls_segment_filename",
    slash(outputSegmentPath),
    "-master_pl_name",
    "master.m3u8",
    slash(outputPath)
  );

  const result = await executeCommand("ffmpeg", args);
  if (result.exitCode !== 0) {
    throw new Error(`FFmpeg failed: ${result.stderr}`);
  }
  return true;
};

const encodeMax720 = async ({ bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution }: EncodeByResolution) => {
  const args = ["-y", "-i", slash(inputPath), "-preset", "veryslow", "-g", "48", "-crf", "17", "-sc_threshold", "0"];

  // Video stream
  args.push(
    "-s:v:0",
    `${getWidth(720, resolution)}x720`, // Set resolution to 720p
    "-c:v:0",
    "libx264",
    "-b:v:0",
    `${bitrate[720]}`,
    "-c:a:0",
    "aac",
    "-b:a:0",
    "128k"
  );

  // HLS output settings
  args.push(
    "-f",
    "hls",
    "-hls_time",
    "6",
    "-hls_list_size",
    "0",
    "-hls_playlist_type",
    "event",
    "-hls_segment_filename",
    slash(outputSegmentPath),
    "-master_pl_name",
    "master.m3u8",
    slash(outputPath)
  );

  const result = await executeCommand("ffmpeg", args);
  if (result.exitCode !== 0) {
    throw new Error(`FFmpeg failed: ${result.stderr}`);
  }
  return true;
};

const encodeMax1080 = async ({ bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution }: EncodeByResolution) => {
  const args = ["-y", "-i", slash(inputPath), "-preset", "veryslow", "-g", "48", "-crf", "17", "-sc_threshold", "0"];

  // Video stream
  args.push(
    "-s:v:0",
    `${getWidth(1080, resolution)}x1080`, // Set resolution to 1080p
    "-c:v:0",
    "libx264",
    "-b:v:0",
    `${bitrate[1080]}`,
    "-c:a:0",
    "aac",
    "-b:a:0",
    "128k"
  );

  // HLS output settings
  args.push(
    "-f",
    "hls",
    "-hls_time",
    "6",
    "-hls_list_size",
    "0",
    "-hls_playlist_type",
    "event",
    "-hls_segment_filename",
    slash(outputSegmentPath),
    "-master_pl_name",
    "master.m3u8",
    slash(outputPath)
  );

  const result = await executeCommand("ffmpeg", args);
  if (result.exitCode !== 0) {
    throw new Error(`FFmpeg failed: ${result.stderr}`);
  }
  return true;
};

const encodeMaxResolution = async ({ bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution }: EncodeByResolution) => {
  const targetHeight: 1440 | 2160 = resolution.height >= 2160 ? 2160 : 1440; // Cap to 4K or 1440p
  const targetBitrate = targetHeight === 2160 ? bitrate[2160] : bitrate[1440];

  const args = ["-y", "-i", slash(inputPath), "-preset", "veryslow", "-g", "48", "-crf", "17", "-sc_threshold", "0"];

  // Video stream
  args.push(
    "-s:v:0",
    `${getWidth(targetHeight, resolution)}x${targetHeight}`, // Set resolution to target height
    "-c:v:0",
    "libx264",
    "-b:v:0",
    `${targetBitrate}`,
    "-c:a:0",
    "aac",
    "-b:a:0",
    "128k"
  );

  // HLS output settings
  args.push(
    "-f",
    "hls",
    "-hls_time",
    "6",
    "-hls_list_size",
    "0",
    "-hls_playlist_type",
    "event",
    "-hls_segment_filename",
    slash(outputSegmentPath),
    "-master_pl_name",
    "master.m3u8",
    slash(outputPath)
  );

  const result = await executeCommand("ffmpeg", args);
  if (result.exitCode !== 0) {
    throw new Error(`FFmpeg failed: ${result.stderr}`);
  }
  return true;
};

// Final encoding function
export const encodeHLSWithMultipleVideoStreams = async (inputPath: string) => {
  const [bitrate, resolution] = await Promise.all([getBitrate(inputPath), getResolution(inputPath)]);
  const parent_folder = path.dirname(inputPath);
  const outputSegmentPath = path.join(parent_folder, "v%v/fileSequence%d.ts");
  const outputPath = path.join(parent_folder, "v%v/prog_index.m3u8");

  // Apply maximum bitrate for different resolutions
  const bitrate144 = bitrate > MAXIMUM_BITRATE_144P ? MAXIMUM_BITRATE_144P : bitrate;
  const bitrate360 = bitrate > MAXIMUM_BITRATE_360P ? MAXIMUM_BITRATE_360P : bitrate;
  const bitrate720 = bitrate > MAXIMUM_BITRATE_720P ? MAXIMUM_BITRATE_720P : bitrate;
  const bitrate1080 = bitrate > MAXIMUM_BITRATE_1080P ? MAXIMUM_BITRATE_1080P : bitrate;
  const bitrate1440 = bitrate > MAXIMUM_BITRATE_1440P ? MAXIMUM_BITRATE_1440P : bitrate;
  const bitrate4K = bitrate > MAXIMUM_BITRATE_4K ? MAXIMUM_BITRATE_4K : bitrate;

  const isHasAudio = await checkVideoHasAudio(inputPath);

  let encodeFunc = encodeMax144; // Default to 144p
  if (resolution.height > 144) {
    encodeFunc = encodeMax360;
  }
  if (resolution.height > 360) {
    encodeFunc = encodeMax720;
  }
  if (resolution.height > 720) {
    encodeFunc = encodeMax1080;
  }
  if (resolution.height > 1080) {
    encodeFunc = encodeMaxResolution;
  }

  // Encode using the selected function
  await encodeFunc({
    bitrate: {
      144: bitrate144,
      360: bitrate360,
      720: bitrate720,
      1080: bitrate1080,
      1440: bitrate1440,
      2160: bitrate4K,
      original: bitrate
    },
    inputPath,
    isHasAudio,
    outputPath,
    outputSegmentPath,
    resolution
  });

  return true;
};
