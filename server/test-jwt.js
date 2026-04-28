import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const testJwt = () => {
    const secret = process.env.JWT_SECRET;
    console.log('Secret:', secret);

    const payload = { id: 'test_id' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    console.log('Token generated');

    try {
        const decoded = jwt.verify(token, secret);
        console.log('Token verified:', decoded.id);
    } catch (err) {
        console.error('Verification failed:', err.message);
    }
};

testJwt();
