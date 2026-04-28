import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    parentFolderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isTrash: {
        type: Boolean,
        default: false
    },
    isStarred: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    color: {
        type: String,
        default: 'amber'
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    folderPassword: {
        type: String,
        default: null
    },
    driveFolderId: {
        type: String,
        default: null
    },
    spaceType: {
        type: String,
        enum: ['main', 'second'],
        default: 'main'
    }
}, { timestamps: true });

export default mongoose.model('Folder', folderSchema);
