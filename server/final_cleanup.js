import mongoose from 'mongoose';
import User from './models/User.js';
import Folder from './models/Folder.js';
import File from './models/File.js';
import dotenv from 'dotenv';

dotenv.config();

async function finalCleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const users = await User.find({});
        for (const user of users) {
            console.log(`Checking user: ${user.username}`);

            // Fix Folders
            const orphanedFolders = await Folder.find({
                ownerId: user._id,
                parentFolderId: null,
                _id: { $nin: [user.rootFolderId, user.secondSpaceRootId] }
            });

            for (const folder of orphanedFolders) {
                const targetParent = folder.space === 'secondary' ? user.secondSpaceRootId : user.rootFolderId;
                if (targetParent) {
                    console.log(`  Moving folder "${folder.name}" to parent ${targetParent} (${folder.space})`);
                    folder.parentFolderId = targetParent;
                    await folder.save();
                } else {
                    console.log(`  Warning: folder "${folder.name}" has no target parent!`);
                }
            }

            // Fix Files
            const orphanedFiles = await File.find({
                ownerId: user._id,
                folderId: null
            });

            for (const file of orphanedFiles) {
                const targetParent = file.space === 'secondary' ? user.secondSpaceRootId : user.rootFolderId;
                if (targetParent) {
                    console.log(`  Moving file "${file.name}" to folder ${targetParent} (${file.space})`);
                    file.folderId = targetParent;
                    await file.save();
                }
            }
        }

        // Global check: Ensure ALL items have a space
        await Folder.updateMany({ space: { $exists: false } }, { $set: { space: 'primary' } });
        await File.updateMany({ space: { $exists: false } }, { $set: { space: 'primary' } });

        console.log('Final cleanup complete.');
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

finalCleanup();
