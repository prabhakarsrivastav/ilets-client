import multer from "multer";

// Use memory storage for Cloudinary uploads
// Files are stored in memory as Buffer objects, then uploaded to Cloudinary
const memoryStorage = multer.memoryStorage();

// File filter for audio files
const audioFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/ogg",
        "audio/m4a",
        "audio/x-m4a",
        "audio/mp4",
        "audio/aac"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only audio files are allowed (MP3, WAV, OGG, M4A, AAC)."));
    }
};

// File filter for image files
const imageFileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only image files are allowed (JPEG, PNG, GIF, WebP)."));
    }
};

// Configure multer with memory storage for audio uploads to Cloudinary
export const audioUpload = multer({
    storage: memoryStorage,
    fileFilter: audioFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max for 30-minute audio files
    }
});

// Configure multer with memory storage for image uploads to Cloudinary
export const imageUpload = multer({
    storage: memoryStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max for images
    }
});

// Helper to check if a URL is a Cloudinary URL
export const isCloudinaryUrl = (url: string): boolean => {
    return url.includes("cloudinary.com") || url.includes("res.cloudinary");
};

// Helper to extract public_id from Cloudinary URL for deletion
export const getCloudinaryPublicId = (url: string): string | null => {
    if (!isCloudinaryUrl(url)) return null;

    // Cloudinary URL format: https://res.cloudinary.com/cloud_name/video/upload/v123/folder/public_id.ext
    const match = url.match(/\/v\d+\/(.+)\.\w+$/);
    if (match) {
        return match[1]; // Returns "folder/public_id"
    }
    return null;
};
