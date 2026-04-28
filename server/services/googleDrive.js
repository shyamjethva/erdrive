import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Initialize the Google Drive API client using OAuth2
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export const googleDriveService = {
    /**
     * Create a folder in Google Drive
     * @param {string} name Folder name
     * @param {string} parentId Parent folder ID in Google Drive
     * @returns {Promise<string>} Created folder ID
     */
    createFolder: async (name, parentId = process.env.GOOGLE_DRIVE_PARENT_ID) => {
        try {
            const fileMetadata = {
                name: name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: parentId ? [parentId] : []
            };

            const folder = await drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
                supportsAllDrives: true
            });

            return folder.data.id;
        } catch (error) {
            console.error('Google Drive Create Folder Error:', error);
            throw error;
        }
    },

    /**
     * Upload a file to Google Drive
     * @param {string} filePath Local path of the file to upload
     * @param {string} fileName Original file name
     * @param {string} mimetype File mime type
     * @param {string} parentId Parent folder ID in Google Drive
     * @returns {Promise<Object>} Drive file metadata (id, size, webViewLink, etc.)
     */
    uploadFile: async (filePath, fileName, mimetype, parentId = process.env.GOOGLE_DRIVE_PARENT_ID) => {
        try {
            const fileMetadata = {
                name: fileName,
                parents: parentId ? [parentId] : []
            };

            const media = {
                mimeType: mimetype,
                body: fs.createReadStream(filePath)
            };

            const file = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, name, size, webViewLink, webContentLink',
                supportsAllDrives: true
            });

            return file.data;
        } catch (error) {
            console.error('Google Drive Upload Error:', error);
            throw error;
        }
    },

    /**
     * Delete a file or folder from Google Drive
     * @param {string} driveItemId Google Drive File/Folder ID
     */
    deleteItem: async (driveItemId) => {
        try {
            await drive.files.delete({
                fileId: driveItemId,
                supportsAllDrives: true
            });
        } catch (error) {
            console.error('Google Drive Delete Error:', error);
            // Don't throw if it's already deleted (404)
            if (error.code !== 404) throw error;
        }
    },

    /**
     * Get a download stream for a file
     * @param {string} driveFileId Google Drive File ID
     * @returns {Promise<Stream>}
     */
    downloadFileStream: async (driveFileId) => {
        try {
            const response = await drive.files.get(
                { fileId: driveFileId, alt: 'media', supportsAllDrives: true },
                { responseType: 'stream' }
            );
            return response.data;
        } catch (error) {
            console.error('Google Drive Download Error:', error);
            throw error;
        }
    },

    /**
     * Move a file or folder to trash in Google Drive
     * @param {string} driveItemId Google Drive File/Folder ID
     */
    trashItem: async (driveItemId) => {
        try {
            await drive.files.update({
                fileId: driveItemId,
                requestBody: { trashed: true },
                supportsAllDrives: true
            });
        } catch (error) {
            console.error('Google Drive Trash Error:', error);
            throw error;
        }
    },

    /**
     * Restore a file or folder from trash in Google Drive
     * @param {string} driveItemId Google Drive File/Folder ID
     */
    untrashItem: async (driveItemId) => {
        try {
            await drive.files.update({
                fileId: driveItemId,
                requestBody: { trashed: false },
                supportsAllDrives: true
            });
        } catch (error) {
            console.error('Google Drive Untrash Error:', error);
            throw error;
        }
    },

    /**
     * Rename a file or folder in Google Drive
     * @param {string} driveItemId Google Drive File/Folder ID
     * @param {string} newName New name
     */
    renameItem: async (driveItemId, newName) => {
        try {
            await drive.files.update({
                fileId: driveItemId,
                requestBody: { name: newName },
                supportsAllDrives: true
            });
        } catch (error) {
            console.error('Google Drive Rename Error:', error);
            throw error;
        }
    },

    /**
     * List files in a folder
     * @param {string} parentId Google Drive Folder ID
     * @returns {Promise<Array>}
     */
    listFiles: async (parentId = process.env.GOOGLE_DRIVE_PARENT_ID) => {
        try {
            const response = await drive.files.list({
                q: `'${parentId}' in parents and trashed = false`,
                fields: 'files(id, name, mimeType)',
                supportsAllDrives: true,
                includeItemsFromAllDrives: true
            });
            return response.data.files;
        } catch (error) {
            console.error('Google Drive List Error:', error);
            throw error;
        }
    },

    /**
     * Get metadata of a file or folder
     * @param {string} driveItemId Google Drive File/Folder ID
     * @returns {Promise<Object>}
     */
    getFileMetadata: async (driveItemId) => {
        try {
            const response = await drive.files.get({
                fileId: driveItemId,
                fields: 'id, name, mimeType',
                supportsAllDrives: true
            });
            return response.data;
        } catch (error) {
            console.error('Google Drive Get Metadata Error:', error);
            throw error;
        }
    },

    /**
     * Get information about the drive and user
     * @returns {Promise<Object>}
     */
    /**
     * Set permissions for a file or folder in Google Drive.
     * @param {string} driveItemId Google Drive File/Folder ID
     * @param {boolean} isLocked If true, removes 'anyoneWithLink' access. If false, (optional) handles unlocking.
     */
    setFolderPrivacy: async (driveItemId, isLocked) => {
        try {
            // Get current permissions
            const res = await drive.permissions.list({
                fileId: driveItemId,
                supportsAllDrives: true
            });

            const permissions = res.data.permissions || [];

            if (isLocked) {
                // Remove permissions that make it "open" (like 'anyone')
                for (const perm of permissions) {
                    if (perm.type === 'anyone') {
                        await drive.permissions.delete({
                            fileId: driveItemId,
                            permissionId: perm.id,
                            supportsAllDrives: true
                        });
                    }
                }
            } else {
                // If we want to make it "open" again (optional, depending on user requirement)
                // For now, we'll just keep it private unless explicit sharing is used.
            }
        } catch (error) {
            console.error('Google Drive Set Privacy Error:', error);
            throw error;
        }
    },

    getAbout: async () => {
        try {
            const response = await drive.about.get({
                fields: 'user, storageQuota, canCreateDrives'
            });
            return response.data;
        } catch (error) {
            console.error('Google Drive About Error:', error);
            throw error;
        }
    }
};
