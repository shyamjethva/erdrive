import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'Employee'],
        default: 'Employee'
    },
    storageLimit: {
        type: Number,
        default: 5 * 1024 * 1024 * 1024 // 5GB default
    },
    storageUsed: {
        type: Number,
        default: 0
    },
    rootFolderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    },
    avatar: {
        type: String,
        default: null
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    loginHistory: [{
        ip: String,
        date: { type: Date, default: Date.now },
        device: String
    }],
    secondSpaceRootFolderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    },
    secondSpacePin: {
        type: String,
        default: null
    },
    hasSecondSpace: {
        type: Boolean,
        default: false
    },
    secondSpaceUsername: {
        type: String,
        default: 'User'
    },
    secondSpaceAvatar: {
        type: String,
        default: null
    },
    secondSpaceEmail: {
        type: String,
        default: null
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
