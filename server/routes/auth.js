import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Folder from '../models/Folder.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('DEBUG: Login attempt for:', username);
        // Find user case-insensitively
        const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

        if (!user) {
            console.log('DEBUG: Login failed - User not found:', username);
            return res.status(401).send({ error: 'Invalid login credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('DEBUG: Login failed - Password mismatch for:', username);
            return res.status(401).send({ error: 'Invalid login credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get user list for sharing
router.get('/list', auth, async (req, res) => {
    try {
        console.log('Share list requested by:', req.user.username, 'ID:', req.user._id);
        const users = await User.find({})
            .select('username avatar role _id')
            .sort({ username: 1 });

        console.log('DEBUG: ALL Users found:', users.length, users.map(u => u.username));
        res.send(users);
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).send(error);
    }
});

// Get current user session
router.get('/me', auth, async (req, res) => {
    try {
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Update profile basic info
router.patch('/update', auth, async (req, res) => {
    try {
        const isSecondSpace = req.headers['x-second-space'] === 'true' || req.body.isSecondSpace === true;
        if (username) {
            if (isSecondSpace) {
                req.user.secondSpaceUsername = username;
            } else {
                const existing = await User.findOne({ username, _id: { $ne: req.user._id } });
                if (existing) return res.status(400).send({ error: 'Username already taken' });
                req.user.username = username;
            }
        }
        if (email) {
            if (isSecondSpace) {
                req.user.secondSpaceEmail = email;
            } else {
                const existingEmail = await User.findOne({ email, _id: { $ne: req.user._id } });
                if (existingEmail) return res.status(400).send({ error: 'Email already in use' });
                req.user.email = email;
            }
        }
        if (twoFactorEnabled !== undefined) {
            req.user.twoFactorEnabled = twoFactorEnabled;
        }
        await req.user.save();
        res.send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const isMatch = await req.user.comparePassword(currentPassword);
        if (!isMatch) return res.status(401).send({ error: 'Incorrect current password' });

        req.user.password = newPassword; // Hashing happens in pre-save hook
        await req.user.save();
        res.send({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Avatar upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'storage/avatars';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send({ error: 'No file uploaded' });

        const avatarUrl = `/storage/avatars/${req.file.filename}`;
        const isSecondSpace = req.headers['x-second-space'] === 'true' || req.body.isSecondSpace === 'true' || req.body.isSecondSpace === true;

        if (isSecondSpace) {
            req.user.secondSpaceAvatar = avatarUrl;
        } else {
            req.user.avatar = avatarUrl;
        }
        await req.user.save();

        res.send({ user: req.user, avatarUrl });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

export default router;
