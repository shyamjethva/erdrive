import mongoose from 'mongoose';
import User from './models/User.js';
import Folder from './models/Folder.js';
import dotenv from 'dotenv';

dotenv.config();

async function repairRoots() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const users = await User.find({});
        for (const user of users) {
            console.log(`Checking user: ${user.username}`);

            // Check Primary Root
            let primaryRoot = await Folder.findById(user.rootFolderId);
            if (!primaryRoot) {
                console.log(`  Adding missing Primary Root for ${user.username}`);
                primaryRoot = new Folder({
                    name: 'root',
                    ownerId: user._id,
                    parentFolderId: null,
                    space: 'primary'
                });
                await primaryRoot.save();
                user.rootFolderId = primaryRoot._id;
                await user.save();
            } else {
                // Ensure space and parent are correct
                if (primaryRoot.space !== 'primary' || primaryRoot.parentFolderId !== null) {
                    console.log(`  Updating Primary Root properties for ${user.username}`);
                    primaryRoot.space = 'primary';
                    primaryRoot.parentFolderId = null;
                    await primaryRoot.save();
                }
            }

            // Check Secondary Root (if it should exist)
            if (user.secondSpacePassword || user.secondSpaceRootId) {
                let secondaryRoot = await Folder.findById(user.secondSpaceRootId);
                if (!secondaryRoot) {
                    console.log(`  Adding missing Secondary Root for ${user.username}`);
                    secondaryRoot = new Folder({
                        name: 'Second Space',
                        ownerId: user._id,
                        parentFolderId: null,
                        space: 'secondary'
                    });
                    await secondaryRoot.save();
                    user.secondSpaceRootId = secondaryRoot._id;
                    await user.save();
                } else {
                    if (secondaryRoot.space !== 'secondary' || secondaryRoot.parentFolderId !== null) {
                        console.log(`  Updating Secondary Root properties for ${user.username}`);
                        secondaryRoot.space = 'secondary';
                        secondaryRoot.parentFolderId = null;
                        await secondaryRoot.save();
                    }
                }
            }
        }

        console.log('Root repair complete.');
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

repairRoots();
