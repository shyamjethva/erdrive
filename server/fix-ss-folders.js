import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Folder from './models/Folder.js';

dotenv.config();

async function fixFolders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await Folder.updateMany(
            { name: '[Second Space]', isSecondSpace: true },
            { $set: { isLocked: false } }
        );

        console.log(`Updated ${result.modifiedCount} folders.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixFolders();
