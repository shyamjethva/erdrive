import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/google_drive_clone');
        const user = await User.findOne({ username: 'admin' });
        console.log('User found:', !!user);
        if (user) {
            console.log('Username:', user.username);
            console.log('secondSpacePassword set:', !!user.secondSpacePassword);
            console.log('secondSpaceRootId:', user.secondSpaceRootId);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debug();
