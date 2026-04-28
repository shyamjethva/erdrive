import express from 'express';
import User from '../models/User.js';
import Folder from '../models/Folder.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.send(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Create new employee (Admin only)
router.post('/users', auth, adminAuth, async (req, res) => {
    try {
        console.log('Received user creation request:', req.body);
        const { username, email, password, role, storageLimit } = req.body;

        // Check if user exists
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).send({ error: 'Username already taken' });

        const user = new User({ username, email, password, role, storageLimit });
        await user.save();

        // Automatically create root folder for the user
        const rootFolder = new Folder({
            name: 'root',
            ownerId: user._id,
            parentFolderId: null
        });
        await rootFolder.save();

        user.rootFolderId = rootFolder._id;
        await user.save();

        res.status(201).send({ user, rootFolder });
    } catch (error) {
        console.error('SERVER ERROR (User Creation):', error);
        res.status(400).send({
            error: error.message || 'Error creating user',
            details: error.errors // Mongoose validation errors
        });
    }
});

// Update user (Admin only)
router.patch('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const { username, email, role, storageLimit } = req.body;
        const updateData = { role, storageLimit };
        if (username) updateData.username = username;
        if (email) updateData.email = email;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).send({ error: 'User not found' });
        res.send(user);
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Delete user (Admin only)
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).send({ error: 'User not found' });

        // Clean up: In a real app, delete their files/folders or mark as deleted
        res.send({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

export default router;
