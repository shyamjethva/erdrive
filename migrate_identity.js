const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Basic User Schema for migration
const userSchema = new mongoose.Schema({
    username: String,
    hasSecondSpace: Boolean,
    secondSpaceUsername: String
});

async function migrate() {
    try {
        // Load .env
        const envPath = path.join(__dirname, 'server', '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const mongoUri = envContent.match(/MONGODB_URI=(.*)/)[1].trim();

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const User = mongoose.model('UserMigrate', userSchema, 'users');

        const result = await User.updateMany(
            { hasSecondSpace: true, secondSpaceUsername: { $exists: false } },
            { $set: { secondSpaceUsername: 'User' } }
        );

        console.log('Migration complete:', result);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}
migrate();
