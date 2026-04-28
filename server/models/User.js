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
    secondSpacePassword: {
        type: String,
        default: null
    },
    secondSpaceRootId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder'
    },
    secondSpaceUsername: {
        type: String,
        default: null
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
    }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
    if (this.isModified('password') && this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    if (this.isModified('secondSpacePassword') && this.secondSpacePassword) {
        this.secondSpacePassword = await bcrypt.hash(this.secondSpacePassword, 10);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare second space password
userSchema.methods.compareSecondSpacePassword = async function (candidatePassword) {
    if (!this.secondSpacePassword || !candidatePassword) return false;
    return await bcrypt.compare(candidatePassword, this.secondSpacePassword);
};

export default mongoose.model('User', userSchema);
