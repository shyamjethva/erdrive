import mongoose from 'mongoose';
import User from './models/User.js';
import Folder from './models/Folder.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkShyamFolders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const shyam = await User.findOne({ username: 'shyam' });
        if (!shyam) {
            console.log('Shyam not found');
            return;
        }

        console.log(`--- User: shyam (${shyam._id}) ---`);
        console.log(`  rootFolderId: ${shyam.rootFolderId}`);

        const folders = await Folder.find({ ownerId: shyam._id });
        console.log(`  Total folders: ${folders.length}`);
        folders.forEach(f => {
            console.log(`    - ${f.name} (ID: ${f._id}, Space: ${f.space}, Parent: ${f.parentFolderId})`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkShyamFolders();
