import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Folder from './models/Folder.js';

dotenv.config();

const fullSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing (just in case)
        await User.deleteMany({});
        await Folder.deleteMany({});

        const users = [
            { username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'Admin' },
            { username: 'shyam', email: 'shyam@example.com', password: 'password123', role: 'Employee' },
            { username: 'manav', email: 'manav@example.com', password: 'password123', role: 'Employee' },
            { username: 'rohit', email: 'rohit@example.com', password: 'password123', role: 'Employee' }
        ];

        for (const userData of users) {
            const user = new User({
                ...userData,
                storageLimit: userData.role === 'Admin' ? 100 * 1024 * 1024 * 1024 : 5 * 1024 * 1024 * 1024
            });
            await user.save();

            const rootFolder = new Folder({
                name: 'root',
                ownerId: user._id,
                parentFolderId: null
            });
            await rootFolder.save();

            user.rootFolderId = rootFolder._id;
            await user.save();
            console.log(`Seeded user: ${user.username}`);
        }

        console.log('Full seed complete');
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
};

fullSeed();
