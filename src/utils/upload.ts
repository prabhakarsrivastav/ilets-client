import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads/audio");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `audio-${uniqueSuffix}${ext}`);
    }
});

// File filter for audio files
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/x-m4a"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only audio files are allowed."));
    }
};

// Configure multer
export const audioUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max
    }
});

// Helper to get audio URL from filename
export const getAudioUrl = (filename: string): string => {
    return `/uploads/audio/${filename}`;
};

// Helper to delete old audio file
export const deleteAudioFile = (audioUrl: string): void => {
    if (audioUrl.startsWith("/uploads/audio/")) {
        const filename = audioUrl.replace("/uploads/audio/", "");
        const filepath = path.join(uploadsDir, filename);

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    }
};
