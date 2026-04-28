import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function resetAdminSecondSpace() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await User.findOne({ username: 'admin' });
        if (!admin) {
            console.log('Admin not found');
            return;
        }

        admin.secondSpaceRootId = undefined;
        admin.secondSpacePassword = undefined;
        await admin.save();

        console.log('Admin Second Space fields cleared for clean setup.');
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

resetAdminSecondSpace();
