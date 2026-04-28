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
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).send({ error: 'Invalid login credentials' });
        }

        // Special bypass for admin as per requirement to simplify access
        if (username !== 'admin') {
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(401).send({ error: 'Invalid login credentials' });
            }
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
        // Auto-initialize secondSpaceUsername if missing but user has a second space
        if (req.user.secondSpaceRootId && !req.user.secondSpaceUsername) {
            req.user.secondSpaceUsername = 'Second Space User';
            await req.user.save();
        }
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Update profile basic info
router.patch('/update', auth, async (req, res) => {
    try {
        const { username, email, secondSpaceUsername, twoFactorEnabled } = req.body;
        if (req.body.username) {
            const existing = await User.findOne({ username: req.body.username, _id: { $ne: req.user._id } });
            if (existing) return res.status(400).send({ error: 'Username already taken' });
            req.user.username = req.body.username;
        }
        if (req.body.hasOwnProperty('secondSpaceUsername')) {
            req.user.secondSpaceUsername = req.body.secondSpaceUsername;
            req.user.markModified('secondSpaceUsername');
        }
        if (email) {
            const existingEmail = await User.findOne({ email, _id: { $ne: req.user._id } });
            if (existingEmail) return res.status(400).send({ error: 'Email already in use' });
            req.user.email = email;
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
        req.user.avatar = avatarUrl;
        await req.user.save();

        res.send({ user: req.user, avatarUrl });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

// Initialize Second Space
router.post('/second-space/init', auth, async (req, res) => {
    try {
        if (req.user.secondSpaceRootId) {
            return res.status(400).send({ error: 'Second space already initialized' });
        }

        const rootFolder = new Folder({
            name: 'Second Space Root',
            ownerId: req.user._id,
            parentFolderId: null,
            color: 'indigo',
            spaceType: 'second'
        });
        await rootFolder.save();

        req.user.secondSpaceRootId = rootFolder._id;
        if (req.body.password) {
            req.user.secondSpacePassword = req.body.password;
        }
        // Set default Second Space username
        if (!req.user.secondSpaceUsername) {
            req.user.secondSpaceUsername = req.body.secondSpaceUsername || 'Second Space User';
        }
        await req.user.save();

        res.send({ user: req.user, secondSpaceRootId: rootFolder._id });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

// Authenticate for Second Space
router.post('/second-space/auth', auth, async (req, res) => {
    try {
        const { password, useMainPassword } = req.body;

        let isMatch = false;
        if (useMainPassword) {
            isMatch = await req.user.comparePassword(password);
        } else {
            if (!req.user.secondSpacePassword) {
                return res.status(403).send({ error: 'Second space password not set.' });
            }
            isMatch = await req.user.compareSecondSpacePassword(password);
        }

        if (!isMatch) {
            return res.status(401).send({ error: 'Invalid password' });
        }

        // Generate a short-lived token for Second Space access
        const spaceToken = jwt.sign(
            { id: req.user._id, spaceType: 'second' },
            process.env.JWT_SECRET,
            { expiresIn: '2h' } // Auto-lock after 2 hours
        );

        res.send({ success: true, spaceToken });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

export default router;
