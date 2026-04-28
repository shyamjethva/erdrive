import mongoose from 'mongoose';
import Folder from './models/Folder.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkHierarchy() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const rootFolder = await Folder.findOne({ name: 'root' });
        if (!rootFolder) {
            console.log('Root folder not found');
            return;
        }

        console.log(`Root Folder: ${rootFolder.name} (ID: ${rootFolder._id}, Space: ${rootFolder.space}, Parent: ${rootFolder.parentFolderId})`);

        const children = await Folder.find({ parentFolderId: rootFolder._id });
        console.log(`Children count of ${rootFolder.name}: ${children.length}`);
        children.forEach(c => {
            console.log(`  - ${c.name} (Space: ${c.space}, ID: ${c._id}, Parent: ${c.parentFolderId})`);
        });

        const siblings = await Folder.find({ parentFolderId: null, ownerId: rootFolder.ownerId });
        console.log(`Sibling folders (null parent) count: ${siblings.length}`);
        siblings.forEach(s => {
            console.log(`  - ${s.name} (Space: ${s.space}, ID: ${s._id}, Parent: ${s.parentFolderId})`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkHierarchy();
