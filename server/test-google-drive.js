import { googleDriveService } from './services/googleDrive.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function verifyGoogleDrive() {
    console.log('--- Google Drive Integration Verification ---');
    console.log('Using Service Account:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('Parent Folder ID:', process.env.GOOGLE_DRIVE_PARENT_ID);

    try {
        // 0.0 Test About
        console.log('\n[0.0/3] Checking Service Account Info...');
        const about = await googleDriveService.getAbout();
        console.log(`✓ Authenticated as: ${about.user.emailAddress}`);
        console.log(`✓ Storage quota limit: ${about.storageQuota.limit} bytes`);
        console.log(`✓ Storage quota usage: ${about.storageQuota.usage} bytes`);

        // 0.1 Test Folder Visibility
        console.log('\n[0.1/3] Testing Folder Visibility...');
        const folderMetadata = await googleDriveService.getFileMetadata(process.env.GOOGLE_DRIVE_PARENT_ID);
        console.log(`✓ Folder found: ${folderMetadata.name} (ID: ${folderMetadata.id})`);

        // 0.2 Test Connection and List Files in Parent
        console.log('\n[0.2/3] Testing Connection and Listing Files...');
        const listResponse = await googleDriveService.listFiles(process.env.GOOGLE_DRIVE_PARENT_ID);
        console.log(`✓ Connection successful. Found ${listResponse.length} items in parent folder.`);

        // 1. Test Folder Creation
        console.log('\n[1/3] Testing Folder Creation...');
        const testFolderName = `Test-Folder-${Date.now()}`;
        const folderId = await googleDriveService.createFolder(testFolderName);
        console.log('✓ Created Folder ID:', folderId);

        // 2. Test File Upload
        console.log('\n[2/3] Testing File Upload...');
        const testFilePath = path.resolve('test-upload.txt');
        fs.writeFileSync(testFilePath, 'Google Drive Integration Test Content');

        const fileData = await googleDriveService.uploadFile(
            testFilePath,
            'test-upload.txt',
            'text/plain',
            folderId
        );
        console.log('✓ Uploaded File ID:', fileData.id);
        console.log('✓ File Link:', fileData.webViewLink);

        // 3. Test Deletion
        console.log('\n[3/3] Testing Deletion...');
        await googleDriveService.deleteItem(fileData.id);
        console.log('✓ Deleted File');
        await googleDriveService.deleteItem(folderId);
        console.log('✓ Deleted Folder');

        // Cleanup local test file
        fs.unlinkSync(testFilePath);

        console.log('\n--- VERIFICATION SUCCESSFUL ---');
        console.log('Your Google Drive integration is correctly configured!');
    } catch (error) {
        console.error('\n--- VERIFICATION FAILED ---');
        console.error(error.message);
        if (error.code === 401 || error.code === 403) {
            console.error('Hint: Check your credentials and ensure the parent folder is shared with the Service Account email.');
        } else if (error.code === 404) {
            console.error('Hint: Parent Folder ID not found. Ensure the ID is correct.');
        }
        process.exit(1);
    }
}

verifyGoogleDrive();
