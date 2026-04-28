import mongoose from 'mongoose';
import dotenv from 'dotenv';
import File from '../models/File.js';
import Folder from '../models/Folder.js';

dotenv.config();

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/google_drive_clone');
        console.log('Connected to MongoDB');

        const filesResult = await File.updateMany(
            { space: { $exists: false } },
            { $set: { space: 'primary' } }
        );
        console.log(`Updated ${filesResult.modifiedCount} files`);

        const foldersResult = await Folder.updateMany(
            { space: { $exists: false } },
            { $set: { space: 'primary' } }
        );
        console.log(`Updated ${foldersResult.modifiedCount} folders`);

        console.log('Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
