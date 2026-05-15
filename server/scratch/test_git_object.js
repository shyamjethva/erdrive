import zlib from 'zlib';
import { googleDriveService } from '../services/googleDrive.js';

async function run() {
    try {
        console.log('Downloading file stream from Google Drive...');
        const stream = await googleDriveService.downloadFileStream('1jLNMk6__iav5TJyozWk3e5gCrPzxhXhX');
        
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);
        console.log('Downloaded', buffer.length, 'bytes');
        console.log('First 10 bytes in hex:', buffer.slice(0, 10).toString('hex'));

        // Attempt to inflate the buffer
        try {
            const decompressed = zlib.inflateSync(buffer);
            console.log('Inflated size:', decompressed.length);
            console.log('Inflated text (first 200 chars):');
            console.log(JSON.stringify(decompressed.slice(0, 200).toString()));
            
            // Check for git header
            const nullIndex = decompressed.indexOf(0);
            if (nullIndex !== -1) {
                const header = decompressed.slice(0, nullIndex).toString();
                console.log('Git Header found:', header);
                const content = decompressed.slice(nullIndex + 1).toString();
                console.log('Git content sample (first 100 chars):');
                console.log(content.slice(0, 100));
            }
        } catch (inflateErr) {
            console.error('Failed to inflate with zlib.inflateSync:', inflateErr.message);
        }
    } catch (err) {
        console.error('Error in run:', err);
    }
}

run();
