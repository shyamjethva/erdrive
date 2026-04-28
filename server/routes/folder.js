import express from 'express';
import Folder from '../models/Folder.js';
import File from '../models/File.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';
import { storageService } from '../services/storage.js';
import { googleDriveService } from '../services/googleDrive.js';

import bcrypt from 'bcryptjs';
const router = express.Router();

// Lock folder
router.post('/:id/lock', auth, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).send({ error: 'Password is required' });
        }

        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).send({ error: 'Folder not found' });

        // Only owner can lock
        if (folder.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send({ error: 'Only owner can lock this folder' });
        }

        const salt = await bcrypt.genSalt(10);
        folder.folderPassword = await bcrypt.hash(password, salt);
        folder.isLocked = true;

        // Sync with Google Drive
        if (process.env.STORAGE_TYPE === 'google_drive' && folder.driveFolderId) {
            await googleDriveService.setFolderPrivacy(folder.driveFolderId, true);
        }

        await folder.save();
        res.send({ message: 'Folder locked successfully', folder });
    } catch (error) {
        console.error('Lock Error:', error);
        res.status(400).send(error);
    }
});

// Unlock folder (verify password)
router.post('/:id/unlock', auth, async (req, res) => {
    try {
        const { password } = req.body;
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).send({ error: 'Folder not found' });

        if (!folder.isLocked) {
            return res.status(400).send({ error: 'Folder is not locked' });
        }

        const isMatch = await bcrypt.compare(password, folder.folderPassword);
        if (!isMatch) {
            return res.status(401).send({ error: 'Invalid password' });
        }

        res.send({ message: 'Access granted', success: true });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Remove lock
router.post('/:id/remove-lock', auth, async (req, res) => {
    try {
        const { password } = req.body;
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).send({ error: 'Folder not found' });

        if (folder.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send({ error: 'Only owner can remove lock' });
        }

        const isMatch = await bcrypt.compare(password, folder.folderPassword);
        if (!isMatch) {
            return res.status(401).send({ error: 'Invalid password' });
        }

        folder.isLocked = false;
        folder.folderPassword = null;

        // Sync with Google Drive (Restore privacy / handle as needed)
        if (process.env.STORAGE_TYPE === 'google_drive' && folder.driveFolderId) {
            await googleDriveService.setFolderPrivacy(folder.driveFolderId, false);
        }

        await folder.save();
        res.send({ message: 'Lock removed successfully', folder });
    } catch (error) {
        console.error('Remove Lock Error:', error);
        res.status(400).send(error);
    }
});

// Get starred folders
router.get('/starred/all', auth, async (req, res) => {
    try {
        const isSecondSpace = req.headers['x-second-space'] === 'true';
        const folders = await Folder.find({
            ownerId: req.user._id,
            isStarred: true,
            isTrash: false,
            isSecondSpace
        }).populate('ownerId', 'username avatar');
        res.send(folders);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Star/Unstar folder
router.patch('/:id/star', auth, async (req, res) => {
    try {
        console.log(`Pin/Star Request: PATCH /api/folders/${req.params.id}/star by user ${req.user._id}`);
        const folder = await Folder.findById(req.params.id);
        if (!folder) {
            console.log(`Folder not found: ${req.params.id}`);
            return res.status(404).send({ error: 'Folder not found' });
        }

        // Allow owner OR if shared with user
        const isOwner = folder.ownerId.toString() === req.user._id.toString();
        const isShared = (folder.sharedWith || []).some(id => id.toString() === req.user._id.toString());

        if (!isOwner && !isShared) {
            console.log(`Permission denied: folder ${req.params.id} for user ${req.user._id}`);
            return res.status(403).send({ error: 'Permission denied' });
        }

        folder.isStarred = !folder.isStarred;
        await folder.save();
        res.send(folder);
    } catch (error) {
        console.error('Star error:', error);
        res.status(400).send(error);
    }
});

// Pin/Unpin folder
router.patch('/:id/pin', auth, async (req, res) => {
    try {
        console.log(`Pin/Star Request: PATCH /api/folders/${req.params.id}/pin by user ${req.user._id}`);
        const folder = await Folder.findById(req.params.id);
        if (!folder) {
            console.log(`Folder not found: ${req.params.id}`);
            return res.status(404).send({ error: 'Folder not found' });
        }

        // Allow owner OR if shared with user
        const isOwner = folder.ownerId.toString() === req.user._id.toString();
        const isShared = (folder.sharedWith || []).some(id => id.toString() === req.user._id.toString());

        if (!isOwner && !isShared) {
            console.log(`Permission denied: folder ${req.params.id} for user ${req.user._id}`);
            return res.status(403).send({ error: 'Permission denied' });
        }

        folder.isPinned = !folder.isPinned;
        await folder.save();
        res.send(folder);
    } catch (error) {
        console.error('Pin error:', error);
        res.status(400).send(error);
    }
});

// Create folder
router.post('/', auth, async (req, res) => {
    try {
        const { name, parentFolderId } = req.body;
        const isSecondSpaceHeader = req.headers['x-second-space'] === 'true';

        let parentDriveFolderId = null;
        let isSecondSpace = isSecondSpaceHeader;

        if (parentFolderId && parentFolderId !== 'root') {
            const parentFolder = await Folder.findById(parentFolderId);
            if (parentFolder) {
                parentDriveFolderId = parentFolder.driveFolderId;
                isSecondSpace = parentFolder.isSecondSpace;
            }
        } else {
            // Creating in root
            if (isSecondSpaceHeader) {
                const ssRoot = await Folder.findById(req.user.secondSpaceRootFolderId);
                parentDriveFolderId = ssRoot?.driveFolderId;
            } else {
                parentDriveFolderId = process.env.GOOGLE_DRIVE_PARENT_ID;
            }
        }

        const driveFolderId = await storageService.createFolder(name, parentDriveFolderId);

        const folder = new Folder({
            name,
            parentFolderId: (parentFolderId === 'root' || !parentFolderId) ? null : parentFolderId,
            ownerId: req.user._id,
            driveFolderId,
            isSecondSpace
        });
        await folder.save();
        res.status(201).send(folder);
    } catch (error) {
        console.error('Folder Creation Error:', error);
        res.status(400).send(error);
    }
});

// Get folders inside a folder
router.get('/parent/:parentFolderId', auth, async (req, res) => {
    try {
        const isSecondSpace = req.headers['x-second-space'] === 'true';
        const normalRootId = req.user.rootFolderId?.toString();
        const secondRootId = req.user.secondSpaceRootFolderId?.toString();

        const isRoot = req.params.parentFolderId === 'root' ||
            req.params.parentFolderId === normalRootId ||
            req.params.parentFolderId === secondRootId;

        const effectiveParentId = isRoot ? (isSecondSpace ? secondRootId : normalRootId) : req.params.parentFolderId;

        const query = {
            parentFolderId: isRoot ? null : effectiveParentId,
            isTrash: false,
            isSecondSpace
        };

        if (isRoot) {
            query.ownerId = req.user._id;
        } else {
            const parentFolder = await Folder.findById(req.params.parentFolderId);
            if (!parentFolder) return res.status(404).send();

            const isOwner = parentFolder.ownerId.toString() === req.user._id.toString();
            const isShared = (parentFolder.sharedWith || []).some(id => id.toString() === req.user._id.toString());

            if (!isOwner && !isShared && req.user.role !== 'Admin') {
                return res.status(403).send({ error: 'Permission denied' });
            }
        }

        const folders = await Folder.find(query)
            .sort({ isPinned: -1, updatedAt: -1 })
            .populate('ownerId', 'username avatar');
        res.send(folders);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get trashed folders — MUST be before /:id routes
router.get('/trash', auth, async (req, res) => {
    try {
        const isSecondSpace = req.headers['x-second-space'] === 'true';
        const query = {
            ownerId: req.user._id,
            isTrash: true,
            isSecondSpace
        };
        const folders = await Folder.find(query);
        res.send(folders);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Rename folder
router.patch('/:id/rename', auth, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).send();
        if (req.user.role !== 'Admin' && folder.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send();
        }

        folder.name = req.body.name;
        await folder.save();
        res.send(folder);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Change folder color
router.patch('/:id/color', auth, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).send();
        if (req.user.role !== 'Admin' && folder.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send();
        }

        folder.color = req.body.color;
        await folder.save();
        res.send(folder);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Move folder to trash
router.patch('/:id/trash', auth, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).send();
        if (req.user.role !== 'Admin' && folder.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send();
        }

        folder.isTrash = true;

        // Sync with Google Drive
        if (folder.driveFolderId) {
            await googleDriveService.trashItem(folder.driveFolderId);
        }

        await folder.save();
        res.send(folder);
    } catch (error) {
        console.error('Folder Trash Error:', error);
        res.status(400).send(error);
    }
});

// Restore folder from trash
router.patch('/:id/restore', auth, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).send();
        if (req.user.role !== 'Admin' && folder.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send();
        }

        folder.isTrash = false;

        // Sync with Google Drive
        if (folder.driveFolderId) {
            await googleDriveService.untrashItem(folder.driveFolderId);
        }

        await folder.save();
        res.send(folder);
    } catch (error) {
        console.error('Folder Restore Error:', error);
        res.status(400).send(error);
    }
});

// Permanently delete folder
router.delete('/:id', auth, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).send();
        if (req.user.role !== 'Admin' && folder.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send();
        }

        // Delete from storage (Google Drive or Local)
        await storageService.deleteFolder(folder);

        // Recursive function to delete folder and contents from DB
        const deleteFolderRecursive = async (folderId) => {
            // Delete files in this folder
            const files = await File.find({ folderId });
            for (const file of files) {
                await File.findByIdAndDelete(file._id);
            }

            // Find subfolders
            const subfolders = await Folder.find({ parentFolderId: folderId });
            for (const sub of subfolders) {
                await deleteFolderRecursive(sub._id);
            }

            // Delete the folder record itself
            await Folder.findByIdAndDelete(folderId);
        };

        await deleteFolderRecursive(folder._id);

        res.send(folder);
    } catch (error) {
        console.error('Folder Delete Error:', error);
        res.status(500).send(error);
    }
});

// Empty trash (Folders)
router.post('/empty-trash', auth, async (req, res) => {
    try {
        const deletedFolders = await Folder.deleteMany({ ownerId: req.user._id, isTrash: true });
        res.send(deletedFolders);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Share folder
router.post('/:id/share', auth, async (req, res) => {
    try {
        const { username } = req.body;
        const userToShareWith = await User.findOne({ username });
        if (!userToShareWith) return res.status(404).send({ error: 'User not found' });

        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).send();
        if (req.user.role !== 'Admin' && folder.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send();
        }

        console.log(`DEBUG: Sharing folder ${folder.name} with user ${username} (${userToShareWith._id})`);

        const isAlreadyShared = (folder.sharedWith || []).some(id => id.toString() === userToShareWith._id.toString());

        if (!isAlreadyShared) {
            folder.sharedWith.push(userToShareWith._id);
            await folder.save();

            // Create notification
            const notification = new Notification({
                recipientId: userToShareWith._id,
                senderId: req.user._id,
                type: 'share',
                message: `shared a folder with you: ${folder.name}`,
                relatedItemId: folder._id,
                relatedItemType: 'folder'
            });
            await notification.save();
            console.log('DEBUG: Notification created successfully:', notification._id);
        } else {
            console.log('DEBUG: Folder already shared with this user, skipping notification.');
        }

        res.send(folder);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get folders shared with me
router.get('/shared/all', auth, async (req, res) => {
    try {
        const folders = await Folder.find({ sharedWith: req.user._id, isTrash: false })
            .populate('ownerId', 'username avatar');
        res.send(folders);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Search folders
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.send([]);

        const isSecondSpace = req.headers['x-second-space'] === 'true';
        const query = {
            name: { $regex: q, $options: 'i' },
            isTrash: false,
            isSecondSpace
        };

        if (req.user.role !== 'Admin') {
            query.$or = [
                { ownerId: req.user._id },
                { sharedWith: req.user._id }
            ];
        }

        const folders = await Folder.find(query)
            .populate('ownerId', 'username avatar')
            .limit(20);
        res.send(folders);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get folder trail (breadcrumbs)
router.get('/:id/trail', auth, async (req, res) => {
    try {
        const trail = [];
        let currentFolder = await Folder.findById(req.params.id);

        while (currentFolder) {
            trail.unshift(currentFolder);
            if (!currentFolder.parentFolderId) break;
            currentFolder = await Folder.findById(currentFolder.parentFolderId);
        }

        res.send(trail);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get folder by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) return res.status(404).send();
        if (req.user.role !== 'Admin' && folder.ownerId.toString() !== req.user._id.toString() && !(folder.sharedWith || []).some(id => id.toString() === req.user._id.toString())) {
            return res.status(403).send();
        }
        res.send(folder);
    } catch (error) {
        res.status(500).send(error);
    }
});

export default router;
