import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Folder from './models/Folder.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/google_drive_clone');
        console.log('Connected to MongoDB');

        const username = 'admin';
        const password = 'admin123'; // In a real app, this should be changed immediately

        const existingAdmin = await User.findOne({ username });
        if (existingAdmin) {
            console.log('Admin already exists. Updating password...');
            existingAdmin.password = password;
            await existingAdmin.save();
            console.log('Admin password updated successfully');
            process.exit(0);
        }

        const admin = new User({
            username,
            email: 'admin@example.com',
            password,
            role: 'Admin',
            storageLimit: 100 * 1024 * 1024 * 1024 // 100GB
        });
        await admin.save();

        const rootFolder = new Folder({
            name: 'root',
            ownerId: admin._id,
            parentFolderId: null
        });
        await rootFolder.save();

        admin.rootFolderId = rootFolder._id;
        await admin.save();

        console.log('Admin seeded successfully');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
