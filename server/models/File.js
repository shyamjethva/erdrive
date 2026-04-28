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
    isSecondSpace: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
});

fileSchema.virtual('previewUrl').get(function () {
    if (!this.storagePath) return null;

    // If it's a Drive link, return it directly
    if (this.storagePath.startsWith('http')) {
        return this.storagePath;
    }

    // Extract the part after 'storage' to use with the static route
    const parts = this.storagePath.split('storage');
    if (parts.length < 2) return null;
    let url = parts[1].replace(/\\/g, '/');
    // Ensure it starts with /
    if (!url.startsWith('/')) url = '/' + url;
    return url;
});

export default mongoose.model('File', fileSchema);
