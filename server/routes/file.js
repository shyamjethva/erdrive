import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import File from '../models/File.js';
import User from '../models/User.js';
import Folder from '../models/Folder.js';
import Notification from '../models/Notification.js';
import { auth } from '../middleware/auth.js';
import { checkSpaceAuth } from '../middleware/spaceAuth.js';
import { storageService } from '../services/storage.js';
import { googleDriveService } from '../services/googleDrive.js';

const ensureSpaceAuth = (req, res, next) => {
    const query = req.query || {};
    const body = req.body || {};
    const spaceType = query.space || body.space || query.spaceType || body.spaceType;

    if (spaceType === 'second') {
        return checkSpaceAuth(req, res, next);
    }
    next();
};

// Helper to find or create folder recursively
async function findOrCreateFolder(pathParts, parentId, ownerId, spaceType = 'main') {
    let currentParentId = parentId;
    for (const folderName of pathParts) {
        let folder = await Folder.findOne({
            name: folderName,
            parentFolderId: currentParentId,
            ownerId,
            spaceType,
            isTrash: false
        });

        if (!folder) {
            // Get parent drive folder ID
            let parentDriveFolderId = null;
            if (currentParentId) {
                const parentFolder = await Folder.findById(currentParentId);
                if (parentFolder) parentDriveFolderId = parentFolder.driveFolderId;
            }

            const driveFolderId = await storageService.createFolder(folderName, parentDriveFolderId);

            folder = new Folder({
                name: folderName,
                parentFolderId: currentParentId,
                ownerId,
                driveFolderId,
                spaceType
            });
            await folder.save();
        }
        currentParentId = folder._id;
    }
    return currentParentId;
}

const router = express.Router();

// Test route
router.get('/ping', (req, res) => res.send('pong'));

// Star/Unstar file
router.patch('/:id/star', auth, async (req, res) => {
    try {
        console.log(`Pin/Star Request: PATCH /api/files/${req.params.id}/star by user ${req.user._id}`);
        const file = await File.findById(req.params.id);
        if (!file) {
            console.log(`File not found: ${req.params.id}`);
            return res.status(404).send({ error: 'File not found' });
        }

        // Allow owner OR if shared with user
        const isOwner = file.ownerId.toString() === req.user._id.toString();
        const isShared = (file.sharedWith || []).some(id => id.toString() === req.user._id.toString());

        if (!isOwner && !isShared) {
            return res.status(403).send({ error: 'Permission denied' });
        }

        file.isStarred = !file.isStarred;
        await file.save();
        res.send(file);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Pin/Unpin file
router.patch('/:id/pin', auth, async (req, res) => {
    try {
        console.log(`Pin Request: PATCH /api/files/${req.params.id}/pin by user ${req.user._id}`);
        const file = await File.findById(req.params.id);
        if (!file) {
            console.log(`File not found: ${req.params.id}`);
            return res.status(404).send({ error: 'File not found' });
        }

        const isOwner = file.ownerId.toString() === req.user._id.toString();
        const isShared = (file.sharedWith || []).some(id => id.toString() === req.user._id.toString());

        if (!isOwner && !isShared) {
            return res.status(403).send({ error: 'Permission denied' });
        }

        file.isPinned = !file.isPinned;
        await file.save();
        res.send(file);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get starred files
router.get('/starred/all', auth, ensureSpaceAuth, async (req, res) => {
    try {
        const { space: spaceType = 'main' } = req.query;
        const files = await File.find({ ownerId: req.user._id, isStarred: true, isTrash: false, spaceType })
            .populate('ownerId', 'username avatar');
        res.send(files);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get files for storage analysis (sorted by size)
router.get('/storage/all', auth, ensureSpaceAuth, async (req, res) => {
    try {
        const { space: spaceType = 'main' } = req.query;
        const files = await File.find({ ownerId: req.user._id, isTrash: { $ne: true }, spaceType })
            .sort({ size: -1 })
            .populate('ownerId', 'username avatar');
        res.send(files);
    } catch (error) {
        console.error('Storage analysis error details:', error);
        res.status(500).send({ error: 'Failed to fetch storage data', details: error.message });
    }
});


// Multer setup for temporary storage
const upload = multer({ dest: 'uploads/' });

// Upload files
router.post('/upload', auth, upload.array('files'), async (req, res) => {
    try {
        const { folderId, paths } = req.body;
        if (!folderId || (folderId !== 'root' && !mongoose.Types.ObjectId.isValid(folderId))) {
            return res.status(400).send({ error: 'Valid folderId is required' });
        }

        let totalSize = 0;
        const uploadedFiles = [];
        const pathArray = Array.isArray(paths) ? paths : [paths];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const relativePath = pathArray[i]; // This will be e.g. "myfolder/sub/file.txt" or just "file.txt"

            let targetFolderId = folderId;
            let targetDriveFolderId = null;
            let fileSpaceType = 'main';

            // Get target drive folder ID and space
            const isVirtualRoot = (req.user.rootFolderId && folderId.toString() === req.user.rootFolderId.toString()) ||
                (req.user.secondSpaceRootId && folderId.toString() === req.user.secondSpaceRootId.toString());

            const isExplicitRoot = folderId === 'root' || isVirtualRoot;

            if (!isExplicitRoot) {
                const folder = await Folder.findById(folderId);
                if (folder) {
                    targetDriveFolderId = folder.driveFolderId;
                    fileSpaceType = folder.spaceType;
                }
            } else {
                // If it's a root (explicit or virtual), determine space
                const isSecondRoot = folderId === 'root'
                    ? (req.body.space === 'second' || req.query.space === 'second')
                    : (req.user.secondSpaceRootId && folderId.toString() === req.user.secondSpaceRootId.toString());

                if (isSecondRoot) {
                    fileSpaceType = 'second';
                    targetFolderId = req.user.secondSpaceRootId;
                } else {
                    fileSpaceType = req.body.space || req.query.space || 'main';
                    targetFolderId = req.user.rootFolderId;
                }

                // FETCH the driveFolderId for the resolved root
                const rootFolderRecord = await Folder.findById(targetFolderId);
                if (rootFolderRecord) targetDriveFolderId = rootFolderRecord.driveFolderId;
            }

            // Handle recursive folder creation if paths are provided
            if (relativePath && relativePath.includes('/')) {
                const parts = relativePath.split('/');
                const folderParts = parts.slice(0, -1); // Remove the filename
                targetFolderId = await findOrCreateFolder(folderParts, folderId, req.user._id, fileSpaceType);
                // After potentially creating folders, get the drive folder ID of the target
                const folder = await Folder.findById(targetFolderId);
                if (folder) targetDriveFolderId = folder.driveFolderId;
            }

            const storageResult = await storageService.saveFile(file, req.user._id, targetDriveFolderId);

            const newFile = new File({
                name: file.originalname,
                folderId: targetFolderId,
                ownerId: req.user._id,
                size: storageResult.size,
                mimetype: file.mimetype,
                storagePath: storageResult.storagePath,
                driveFileId: storageResult.driveFileId,
                spaceType: fileSpaceType
            });

            await newFile.save();
            totalSize += storageResult.size;
            uploadedFiles.push(newFile);
        }

        // Update user storage usage once
        req.user.storageUsed += totalSize;
        await req.user.save();

        res.status(201).send(uploadedFiles);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(400).send(error);
    }
});

// Get files in a folder
router.get('/folder/:folderId', auth, ensureSpaceAuth, async (req, res) => {
    try {
        const { space: spaceType = 'main' } = req.query;
        let effectiveFolderId = req.params.folderId;
        if (effectiveFolderId === 'root' && spaceType === 'second') {
            effectiveFolderId = req.user.secondSpaceRootId;
        }

        const isExplicitRoot = effectiveFolderId === 'root' || !effectiveFolderId;

        const isVirtualMainRoot = req.user.rootFolderId && effectiveFolderId?.toString() === req.user.rootFolderId.toString();
        const isVirtualSecondRoot = req.user.secondSpaceRootId && effectiveFolderId?.toString() === req.user.secondSpaceRootId.toString();
        const isVirtualRoot = isVirtualMainRoot || isVirtualSecondRoot;

        const query = { isTrash: false };

        if (spaceType === 'second' || isVirtualSecondRoot) {
            if (isExplicitRoot || isVirtualSecondRoot) {
                query.$or = [
                    { spaceType: 'second' },
                    { folderId: req.user.secondSpaceRootId }
                ];
                query.ownerId = req.user._id;
                if (req.user.secondSpaceRootId) {
                    query._id = { $ne: req.user.secondSpaceRootId };
                }
            } else {
                query.folderId = effectiveFolderId;
                query.spaceType = 'second';
            }
        } else {
            if (isExplicitRoot || isVirtualMainRoot) {
                query.folderId = { $in: [null, req.user.rootFolderId] };
                if (req.user.secondSpaceRootId) {
                    query.folderId.$ne = req.user.secondSpaceRootId;
                }
                query.$or = [
                    { spaceType: 'main' },
                    { spaceType: 'primary' },
                    { spaceType: { $exists: false } }
                ];
                query.ownerId = req.user._id;
                if (req.user.rootFolderId) {
                    query._id = { $ne: req.user.rootFolderId };
                }
            } else {
                query.folderId = effectiveFolderId;
                query.$or = [
                    { spaceType: 'main' },
                    { spaceType: 'primary' },
                    { spaceType: { $exists: false } }
                ];
            }
        }

        if (isExplicitRoot || isVirtualRoot) {
            query.ownerId = req.user._id;
        } else {
            const folder = await Folder.findById(req.params.folderId);
            if (!folder) return res.status(404).send({ error: 'Folder not found' });

            const isOwner = folder.ownerId.toString() === req.user._id.toString();
            const isShared = (folder.sharedWith || []).some(id => id.toString() === req.user._id.toString());

            if (!isOwner && !isShared && req.user.role !== 'Admin') {
                return res.status(403).send({ error: 'Permission denied' });
            }
        }

        const files = await File.find(query)
            .sort({ isPinned: -1, updatedAt: -1 })
            .populate('ownerId', 'username avatar');
        res.send(files);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get recent files — MUST be before /:id routes
router.get('/recent', auth, ensureSpaceAuth, async (req, res) => {
    try {
        const { space: spaceType = 'main' } = req.query;
        const query = { ownerId: req.user._id, isTrash: { $ne: true }, spaceType };
        const files = await File.find(query)
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('ownerId', 'username avatar');
        res.send(files);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get trashed files — MUST be before /:id routes
router.get('/trash', auth, ensureSpaceAuth, async (req, res) => {
    try {
        const { space: spaceType = 'main' } = req.query;
        const query = {
            ownerId: req.user._id,
            isTrash: true,
            spaceType
        };
        const files = await File.find(query);
        res.send(files);
    } catch (error) {
        res.status(500).send(error);
    }
});

// View file (inline)
router.get('/view/:id', auth, ensureSpaceAuth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).send();

        // Check access
        if (req.user.role !== 'Admin' && file.ownerId.toString() !== req.user._id.toString() && !(file.sharedWith || []).some(id => id.toString() === req.user._id.toString())) {
            return res.status(403).send({ error: 'Access denied' });
        }

        // Stream from Google Drive if available
        if (file.driveFileId) {
            const stream = await googleDriveService.downloadFileStream(file.driveFileId);
            res.setHeader('Content-Type', file.mimetype);
            res.setHeader('Content-Disposition', 'inline');
            stream.pipe(res);
            return;
        }

        // Local file
        res.setHeader('Content-Type', file.mimetype);
        res.setHeader('Content-Disposition', 'inline');
        res.sendFile(path.resolve(file.storagePath));
    } catch (error) {
        console.error('View error:', error);
        res.status(500).send(error);
    }
});

// Download file
router.get('/download/:id', auth, ensureSpaceAuth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).send();

        // Check access
        if (req.user.role !== 'Admin' && file.ownerId.toString() !== req.user._id.toString() && !(file.sharedWith || []).some(id => id.toString() === req.user._id.toString())) {
            return res.status(403).send({ error: 'Access denied' });
        }

        // Stream from Google Drive if available
        if (file.driveFileId) {
            const stream = await googleDriveService.downloadFileStream(file.driveFileId);
            res.setHeader('Content-Type', file.mimetype);
            res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
            stream.pipe(res);
            return;
        }

        res.download(file.storagePath, file.name, (err) => {
            if (err) {
                console.error('Download error:', err);
                if (!res.headersSent) {
                    res.status(500).send({ error: 'Download failed' });
                }
            }
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Rename file
router.patch('/:id/rename', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).send();
        if (req.user.role !== 'Admin' && file.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send();
        }

        file.name = req.body.name;
        await file.save();
        res.send(file);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete file (move to trash)
router.patch('/:id/trash', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).send();
        if (req.user.role !== 'Admin' && file.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send();
        }

        file.isTrash = true;

        // Sync with Google Drive
        if (file.driveFileId) {
            await googleDriveService.trashItem(file.driveFileId);
        }

        await file.save();
        res.send(file);
    } catch (error) {
        console.error('File Trash Error:', error);
        res.status(400).send(error);
    }
});

// Restore file from trash
router.patch('/:id/restore', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).send();
        if (req.user.role !== 'Admin' && file.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send();
        }

        file.isTrash = false;

        // Sync with Google Drive
        if (file.driveFileId) {
            await googleDriveService.untrashItem(file.driveFileId);
        }

        await file.save();
        res.send(file);
    } catch (error) {
        console.error('File Restore Error:', error);
        res.status(400).send(error);
    }
});

// Permanently delete file
router.delete('/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).send();
        if (req.user.role !== 'Admin' && file.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send();
        }

        await storageService.deleteFile(file);
        await File.findByIdAndDelete(file._id);

        res.send(file);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Empty trash (Files)
router.post('/empty-trash', auth, async (req, res) => {
    try {
        const { space: spaceType = 'main' } = req.query;
        const files = await File.find({ ownerId: req.user._id, isTrash: true, spaceType });
        for (const file of files) {
            await storageService.deleteFile(file);
            await File.findByIdAndDelete(file._id);
        }
        res.send({ message: 'Trash emptied' });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Share file
router.post('/:id/share', auth, async (req, res) => {
    try {
        const { username } = req.body;
        const userToShareWith = await User.findOne({ username });
        if (!userToShareWith) return res.status(404).send({ error: 'User not found' });

        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).send();
        if (req.user.role !== 'Admin' && file.ownerId.toString() !== req.user._id.toString()) {
            return res.status(403).send();
        }

        console.log(`DEBUG: Sharing file ${file.name} with user ${username} (${userToShareWith._id})`);

        const isAlreadyShared = (file.sharedWith || []).some(id => id.toString() === userToShareWith._id.toString());

        if (!isAlreadyShared) {
            file.sharedWith.push(userToShareWith._id);
            await file.save();

            // Create notification
            const notification = new Notification({
                recipientId: userToShareWith._id,
                senderId: req.user._id,
                type: 'share',
                message: `shared a file with you: ${file.name}`,
                relatedItemId: file._id,
                relatedItemType: 'file'
            });
            await notification.save();
            console.log('DEBUG: Notification created successfully:', notification._id);
        } else {
            console.log('DEBUG: File already shared with this user, skipping notification.');
        }

        res.send(file);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get files shared with me
router.get('/shared/all', auth, async (req, res) => {
    try {
        const { space: spaceType = 'main' } = req.query;
        const files = await File.find({ sharedWith: req.user._id, isTrash: false, spaceType })
            .populate('ownerId', 'username avatar');
        res.send(files);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Search files
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.send([]);

        const query = {
            name: { $regex: q, $options: 'i' },
            isTrash: false,
            spaceType: req.query.space || 'main'
        };

        if (req.user.role !== 'Admin') {
            query.$or = [
                { ownerId: req.user._id },
                { sharedWith: req.user._id }
            ];
        }

        const files = await File.find(query)
            .populate('ownerId', 'username avatar')
            .limit(20);
        res.send(files);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get file by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).send();
        if (req.user.role !== 'Admin' && file.ownerId.toString() !== req.user._id.toString() && !(file.sharedWith || []).some(id => id.toString() === req.user._id.toString())) {
            return res.status(403).send();
        }
        res.send(file);
    } catch (error) {
        res.status(500).send(error);
    }
});

export default router;
