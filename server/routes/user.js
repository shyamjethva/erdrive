import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Folder from '../models/Folder.js';
import { auth } from '../middleware/auth.js';
import { storageService } from '../services/storage.js';
import { googleDriveService } from '../services/googleDrive.js';

const router = express.Router();

/**
 * Setup Second Space
 * Creates a root folder in Google Drive and sets a PIN
 */
router.post('/second-space/setup', auth, async (req, res) => {
    try {
        const { pin } = req.body;
        if (!pin || pin.length < 4) {
            return res.status(400).send({ error: 'Valid PIN is required (min 4 digits)' });
        }

        if (req.user.hasSecondSpace) {
            return res.status(400).send({ error: 'Second Space is already set up' });
        }

        // 1. Create root folder in Google Drive
        const folderName = `[Second Space] - ${req.user.username}`;
        const driveFolderId = await storageService.createFolder(folderName, process.env.GOOGLE_DRIVE_PARENT_ID);

        // 2. Set folder privacy (Make it private)
        if (driveFolderId) {
            await googleDriveService.setFolderPrivacy(driveFolderId, true);
        }

        // 3. Create folder in MongoDB
        const secondSpaceRoot = new Folder({
            name: '[Second Space]',
            ownerId: req.user._id,
            driveFolderId,
            isSecondSpace: true,
            isLocked: false // PIN is enough protection for the whole space
        });
        await secondSpaceRoot.save();

        // 4. Update user
        req.user.secondSpaceRootFolderId = secondSpaceRoot._id;
        req.user.secondSpacePin = await bcrypt.hash(pin, 10);
        req.user.hasSecondSpace = true;
        await req.user.save();

        res.send({ message: 'Second Space set up successfully', rootFolderId: secondSpaceRoot._id });
    } catch (error) {
        console.error('Second Space Setup Error:', error);
        res.status(500).send({ error: 'Failed to set up Second Space' });
    }
});

/**
 * Verify Second Space PIN
 */
router.post('/second-space/unlock', auth, async (req, res) => {
    try {
        const { pin } = req.body;
        if (!pin) return res.status(400).send({ error: 'PIN is required' });

        if (!req.user.hasSecondSpace) {
            return res.status(404).send({ error: 'Second Space not set up' });
        }

        const isMatch = await bcrypt.compare(pin, req.user.secondSpacePin);
        if (!isMatch) {
            return res.status(401).send({ error: 'Incorrect PIN' });
        }

        res.send({
            message: 'Unlocked',
            secondSpaceRootFolderId: req.user.secondSpaceRootFolderId
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

/**
 * Check if Second Space is set up
 */
router.get('/second-space/status', auth, async (req, res) => {
    res.send({
        hasSecondSpace: req.user.hasSecondSpace,
        secondSpaceRootFolderId: req.user.secondSpaceRootFolderId
    });
});

export default router;
