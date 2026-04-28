import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const resetPassword = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI not found in .env');
        }
        await mongoose.connect(uri);
        const user = await User.findOne({ username: 'admin' });
        if (user) {
            user.secondSpacePassword = 'password123';
            // Explicitly mark as modified if needed, though Mongoose should handle it
            user.markModified('secondSpacePassword');
            await user.save();
            console.log('Admin second space password reset successfully to: password123');
        } else {
            console.log('Admin user not found');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error resetting password:', err);
        process.exit(1);
    }
};

resetPassword();
