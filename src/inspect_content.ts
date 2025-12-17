
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import FreeAssessmentContent from './models/FreeAssessmentContent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const inspectContent = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // Find listening content
        const listeningContents = await FreeAssessmentContent.find({ sectionType: 'listening' });
        console.log(`Found ${listeningContents.length} listening content documents`);

        for (const content of listeningContents) {
            console.log('--- Content Doc ---');
            console.log(`ID: ${content._id}, Active: ${content.isActive}, ExamType: ${content.examType || 'N/A'}`);
            if (content.listeningParts) {
                content.listeningParts.forEach((part) => {
                    console.log(`  Part ${part.partNumber}: Questions=${part.questions?.length || 0}`);
                });
            } else {
                console.log('  No listeningParts field');
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

inspectContent();
