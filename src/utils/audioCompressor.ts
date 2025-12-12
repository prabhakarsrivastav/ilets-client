import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { Readable, PassThrough } from "stream";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Compress audio buffer to 128kbps MP3
 * Reduces file size significantly for large audio files
 */
export const compressAudio = (inputBuffer: Buffer): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        // Create temp files for input and output
        const tempDir = os.tmpdir();
        const inputPath = path.join(tempDir, `input-${Date.now()}.mp3`);
        const outputPath = path.join(tempDir, `output-${Date.now()}.mp3`);

        // Write input buffer to temp file
        fs.writeFileSync(inputPath, inputBuffer);

        ffmpeg(inputPath)
            .audioCodec("libmp3lame")
            .audioBitrate("128k")
            .audioChannels(1) // Mono for speech
            .audioFrequency(44100)
            .format("mp3")
            .on("start", (cmd) => {
                console.log("FFmpeg compression started:", cmd);
            })
            .on("error", (err) => {
                console.error("FFmpeg compression error:", err);
                // Cleanup temp files
                try {
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                } catch (e) { /* ignore */ }
                reject(err);
            })
            .on("end", () => {
                console.log("FFmpeg compression complete");
                try {
                    // Read compressed file
                    const compressedBuffer = fs.readFileSync(outputPath);
                    console.log(`Compression: ${inputBuffer.length} bytes -> ${compressedBuffer.length} bytes (${Math.round((1 - compressedBuffer.length / inputBuffer.length) * 100)}% reduction)`);

                    // Cleanup temp files
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);

                    resolve(compressedBuffer);
                } catch (err) {
                    reject(err);
                }
            })
            .save(outputPath);
    });
};
