import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Folder from './models/Folder.js';
import dotenv from 'dotenv';

dotenv.config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = await User.findOne({ username: 'admin' });
        if (!admin) {
            console.log('Admin not found');
            return;
        }

        console.log('--- Admin Status ---');
        console.log('Username:', admin.username);
        console.log('Primary Root ID:', admin.rootFolderId);
        console.log('Second Space Root ID:', admin.secondSpaceRootId);
        console.log('Has Second Space Password:', !!admin.secondSpacePassword);

        if (admin.secondSpaceRootId) {
            const folder = await Folder.findById(admin.secondSpaceRootId);
            console.log('Second Space Root Folder:', folder ? folder.name : 'NOT FOUND');
            console.log('Second Space Root Space:', folder ? folder.space : 'N/A');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

verify();
