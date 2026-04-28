import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { googleDriveService } from './googleDrive.js';

const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const rename = promisify(fs.rename);

const BASE_STORAGE_PATH = path.resolve('storage');

// Ensure base storage directory exists
if (!fs.existsSync(BASE_STORAGE_PATH)) {
    fs.mkdirSync(BASE_STORAGE_PATH, { recursive: true });
}

export const storageService = {
    saveFile: async (file, userId, driveFolderId = null) => {
        const storageType = process.env.STORAGE_TYPE || 'local';

        if (storageType === 'google_drive') {
            const driveFile = await googleDriveService.uploadFile(
                file.path,
                file.originalname,
                file.mimetype,
                driveFolderId || process.env.GOOGLE_DRIVE_PARENT_ID
            );
            // Clean up temp file
            if (fs.existsSync(file.path)) {
                await unlink(file.path);
            }
            return {
                storagePath: driveFile.webViewLink,
                driveFileId: driveFile.id,
                size: parseInt(driveFile.size) || file.size
            };
        } else {
            const userPath = path.join(BASE_STORAGE_PATH, userId.toString());
            if (!fs.existsSync(userPath)) {
                await mkdir(userPath, { recursive: true });
            }
            const finalPath = path.join(userPath, `${Date.now()}-${file.originalname}`);
            await rename(file.path, finalPath);
            return {
                storagePath: finalPath,
                driveFileId: null,
                size: file.size
            };
        }
    },

    createFolder: async (name, parentDriveFolderId = null) => {
        const storageType = process.env.STORAGE_TYPE || 'local';
        if (storageType === 'google_drive') {
            return await googleDriveService.createFolder(name, parentDriveFolderId || process.env.GOOGLE_DRIVE_PARENT_ID);
        }
        return null;
    },

    deleteFile: async (file) => {
        const storageType = process.env.STORAGE_TYPE || 'local';

        if (storageType === 'google_drive' && file.driveFileId) {
            await googleDriveService.deleteItem(file.driveFileId);
        } else if (file.storagePath && fs.existsSync(file.storagePath)) {
            await unlink(file.storagePath);
        }
    },

    deleteFolder: async (folder) => {
        const storageType = process.env.STORAGE_TYPE || 'local';

        if (storageType === 'google_drive' && folder.driveFolderId) {
            await googleDriveService.deleteItem(folder.driveFolderId);
        } else {
            // Local folder deletion logic if needed (usually handled by OS or rm -rf)
            // But for now, we focus on Google Drive sync
        }
    },

    // Legacy method names for backward compatibility if needed, but we'll update routes
    saveLocal: async (tempPath, fileName, userId) => {
        const userPath = path.join(BASE_STORAGE_PATH, userId.toString());
        if (!fs.existsSync(userPath)) {
            await mkdir(userPath, { recursive: true });
        }
        const finalPath = path.join(userPath, `${Date.now()}-${fileName}`);
        await rename(tempPath, finalPath);
        return finalPath;
    },

    deleteLocal: async (filePath) => {
        if (filePath && fs.existsSync(filePath)) {
            await unlink(filePath);
        }
    }
};
