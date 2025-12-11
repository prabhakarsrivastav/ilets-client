import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    duration?: number;
    format: string;
    resource_type: string;
    bytes: number;
    original_filename: string;
}

/**
 * Upload audio buffer to Cloudinary
 */
export const uploadAudioToCloudinary = (
    buffer: Buffer,
    originalFilename: string
): Promise<CloudinaryUploadResult> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "video", // Cloudinary uses "video" for audio files
                folder: "ielts-audio",
                public_id: `audio-${Date.now()}`,
                format: "mp3",
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (result) {
                    resolve({
                        public_id: result.public_id,
                        secure_url: result.secure_url,
                        duration: result.duration,
                        format: result.format,
                        resource_type: result.resource_type,
                        bytes: result.bytes,
                        original_filename: originalFilename,
                    });
                } else {
                    reject(new Error("Upload failed - no result returned"));
                }
            }
        );

        // Convert buffer to readable stream and pipe to upload
        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

/**
 * Delete audio from Cloudinary
 */
export const deleteAudioFromCloudinary = async (publicId: string): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
    }
};

export default cloudinary;
