const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
    hasSecondSpace: Boolean,
    secondSpaceUsername: String
}, { strict: false });

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const User = mongoose.model('User', userSchema, 'users');
        const res = await User.updateMany(
            { hasSecondSpace: true, secondSpaceUsername: { $exists: false } },
            { $set: { secondSpaceUsername: 'User' } }
        );
        console.log('Migration OK:', res);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
migrate();
