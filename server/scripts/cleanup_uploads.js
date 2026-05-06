import fs from 'fs';
import path from 'path';

const uploadsDir = 'uploads';

if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log(`Found ${files.length} files in ${uploadsDir}. Cleaning up...`);
    
    let count = 0;
    files.forEach(file => {
        const filePath = path.join(uploadsDir, file);
        // Only delete files (don't delete directories if any)
        if (fs.statSync(filePath).isFile() && file !== '.gitignore') {
            fs.unlinkSync(filePath);
            count++;
        }
    });
    
    console.log(`Successfully deleted ${count} orphaned files.`);
} else {
    console.log('Uploads directory does not exist.');
}
