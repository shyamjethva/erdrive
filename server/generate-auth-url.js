import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive'];

async function generateAuthUrl() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = 'https://developers.google.com/oauthplayground'; // Default for easy setup

    if (!clientId || !clientSecret) {
        console.error('Error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing in .env');
        process.exit(1);
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Required for Refresh Token
        scope: SCOPES,
        prompt: 'consent' // Force consent to ensure refresh token is returned
    });

    console.log('\n--- Google OAuth2 Authorization ---');
    console.log('1. Open this URL in your browser:');
    console.log('\n' + url + '\n');
    console.log('2. Sign in and grant permissions.');
    console.log('3. You will be redirected to OAuth Playground. In the URL bar, you will see "?code=...".');
    console.log('4. Copy the "code" value and paste it here.');
}

generateAuthUrl();
