import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    storagePath: {
        type: String, // Local path or S3 Key
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
    driveFileId: {
        type: String,
        default: null
    },
    spaceType: {
        type: String,
        enum: ['main', 'second'],
        default: 'main'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
});

fileSchema.virtual('previewUrl').get(function () {
    return `/api/files/view/${this._id}`;
});

export default mongoose.model('File', fileSchema);
