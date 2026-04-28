import mongoose from 'mongoose';
import User from './models/User.js';
import Folder from './models/Folder.js';
import dotenv from 'dotenv';

dotenv.config();

async function auditAllFolders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const folders = await Folder.find({}).populate('ownerId', 'username');
        console.log(`--- Total Folders in DB: ${folders.length} ---`);
        folders.forEach(f => {
            console.log(`Folder: ${f.name}`);
            console.log(`  ID: ${f._id}`);
            console.log(`  Owner: ${f.ownerId?.username || 'N/A'}`);
            console.log(`  Parent: ${f.parentFolderId || 'NULL'}`);
            console.log(`  Space: ${f.space}`);
            console.log(`-------------------`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

auditAllFolders();
