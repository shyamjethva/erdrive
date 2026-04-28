import mongoose from 'mongoose';
import User from './models/User.js';
import Folder from './models/Folder.js';
import dotenv from 'dotenv';

dotenv.config();

const TARGET_ROOT_ID = '69e8bd193ffb34abb06b3a57';

async function superRepair() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const admin = await User.findOne({ username: 'admin' });
        if (!admin) {
            console.log('Admin user not found');
            return;
        }

        console.log(`Re-mapping Admin Primary Root to ${TARGET_ROOT_ID}`);

        // 1. Recreate the folder with the specific ID if it exists
        let rootFolder = await Folder.findById(TARGET_ROOT_ID);
        if (!rootFolder) {
            console.log('  Creating missing folder record with ID:', TARGET_ROOT_ID);
            rootFolder = new Folder({
                _id: TARGET_ROOT_ID,
                name: 'root',
                ownerId: admin._id,
                parentFolderId: null,
                space: 'primary'
            });
            await rootFolder.save();
        } else {
            console.log('  Folder record already exists');
            rootFolder.space = 'primary';
            rootFolder.parentFolderId = null;
            rootFolder.ownerId = admin._id;
            await rootFolder.save();
        }

        // 2. Update the user
        const oldRootId = admin.rootFolderId;
        admin.rootFolderId = rootFolder._id;
        await admin.save();
        console.log(`  Admin user updated. Root ID is now ${admin.rootFolderId}`);

        // 3. Migrate folders that were attached to the "new" temporary root back to this one
        if (oldRootId && oldRootId.toString() !== TARGET_ROOT_ID) {
            console.log(`  Migrating folders from temp root ${oldRootId} to ${TARGET_ROOT_ID}`);
            await Folder.updateMany({ parentFolderId: oldRootId }, { $set: { parentFolderId: rootFolder._id } });
            // And delete the temp root if it's empty and not the same
            const tempRoot = await Folder.findById(oldRootId);
            if (tempRoot && tempRoot.name === 'root') {
                await Folder.deleteOne({ _id: oldRootId });
                console.log('  Deleted temporary root record');
            }
        }

        console.log('Super repair complete.');
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

superRepair();
