import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function getRefreshToken() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = 'https://developers.google.com/oauthplayground';
    const code = process.argv[2];

    if (!clientId || !clientSecret || !code) {
        console.error('Usage: node get-refresh-token.js <AUTHORIZATION_CODE>');
        process.exit(1);
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('\n--- Google OAuth2 Tokens ---');
        console.log('Refresh Token:', tokens.refresh_token);
        console.log('Access Token:', tokens.access_token);
        console.log('\nIMPORTANT: Add the Refresh Token to your .env file as GOOGLE_REFRESH_TOKEN');
    } catch (error) {
        console.error('Error getting tokens:', error.message);
    }
}

getRefreshToken();
