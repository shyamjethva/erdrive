import mongoose from 'mongoose';
import User from './models/User.js';
import Folder from './models/Folder.js';
import dotenv from 'dotenv';

dotenv.config();

const testUserCreation = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const testData = {
            username: 'testuser_' + Date.now(),
            password: 'password123',
            role: 'Employee',
            storageLimit: 5 * 1024 * 1024 * 1024
        };

        console.log('Attempting to create user:', testData);
        const user = new User(testData);
        await user.save();
        console.log('User created successfully:', user._id);

        const rootFolder = new Folder({
            name: 'root',
            ownerId: user._id,
            parentFolderId: null
        });
        await rootFolder.save();
        console.log('Root folder created:', rootFolder._id);

        user.rootFolderId = rootFolder._id;
        await user.save();
        console.log('User updated with rootFolderId');

        await mongoose.disconnect();
        console.log('Done');
    } catch (error) {
        console.error('TEST FAILED:', error);
        process.exit(1);
    }
};

testUserCreation();
