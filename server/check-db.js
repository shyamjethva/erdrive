import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI;

const FolderSchema = new mongoose.Schema({
    name: String,
    parentFolderId: mongoose.Schema.Types.ObjectId,
    ownerId: mongoose.Schema.Types.ObjectId,
    spaceType: String,
    space: String
}, { strict: false });

const Folder = mongoose.model('Folder', FolderSchema);

const UserSchema = new mongoose.Schema({
    username: String,
    rootFolderId: mongoose.Schema.Types.ObjectId,
    secondSpaceRootId: mongoose.Schema.Types.ObjectId
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function checkDB() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ username: 'rakshit' });
        console.log('USER INFO:', JSON.stringify({
            username: user.username,
            rootFolderId: user.rootFolderId,
            secondSpaceRootId: user.secondSpaceRootId
        }, null, 2));

        const folders = await Folder.find({ ownerId: user._id }).lean();
        console.log('ALL FOLDERS FOR USER:', JSON.stringify(folders, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error('ERROR:', err);
    }
}

checkDB();
