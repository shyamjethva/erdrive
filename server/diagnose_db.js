import mongoose from 'mongoose';
import Folder from './models/Folder.js';
import File from './models/File.js';
import dotenv from 'dotenv';

dotenv.config();

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const folderCounts = await Folder.aggregate([
            { $group: { _id: "$space", count: { $sum: 1 } } }
        ]);
        const fileCounts = await File.aggregate([
            { $group: { _id: "$space", count: { $sum: 1 } } }
        ]);

        console.log('--- Folder Counts by Space ---');
        console.log(JSON.stringify(folderCounts, null, 2));
        console.log('--- File Counts by Space ---');
        console.log(JSON.stringify(fileCounts, null, 2));

        // Check if any folders have undefined space
        const undefinedFolders = await Folder.find({ space: { $exists: false } }).limit(5);
        if (undefinedFolders.length > 0) {
            console.log('Found folders with NO space field:', undefinedFolders.length);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

diagnose();
