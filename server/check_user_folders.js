import mongoose from 'mongoose';
import User from './models/User.js';
import Folder from './models/Folder.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUserFolders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Let's check all users to see if anyone is in an inconsistent state
        const users = await User.find({});
        for (const user of users) {
            console.log(`--- User: ${user.username} ---`);
            console.log(`  secondSpaceRootId: ${user.secondSpaceRootId}`);
            console.log(`  hasSecondSpacePassword: ${!!user.secondSpacePassword}`);

            const rootFolders = await Folder.find({ ownerId: user._id, parentFolderId: null });
            console.log(`  Root folders count: ${rootFolders.length}`);
            rootFolders.forEach(f => {
                console.log(`    - ${f.name} (Space: ${f.space}, ID: ${f._id})`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkUserFolders();
