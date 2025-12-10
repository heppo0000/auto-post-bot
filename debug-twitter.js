const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function debugTwitter() {
    console.log("--- Starting Twitter Debug ---");

    // 1. Check DB
    if (!fs.existsSync('db.json')) {
        console.error("ERROR: db.json not found. Please login via the app first.");
        return;
    }
    const db = JSON.parse(fs.readFileSync('db.json', 'utf-8'));
    const tokens = db.tokens;

    if (!tokens || !tokens.accessToken) {
        console.error("ERROR: No access token in db.json.");
        return;
    }

    console.log("Token found (first 10 chars):", tokens.accessToken.substring(0, 10) + "...");

    // 2. Try to verify credentials (me)
    const client = new TwitterApi(tokens.accessToken);

    try {
        console.log("Attempting to fetch 'me'...");
        const me = await client.v2.me();
        console.log("Success! Logged in as:", me.data.username, `(ID: ${me.data.id})`);
    } catch (e) {
        console.error("Failed to fetch 'me'. Token might be invalid or expired.");
        console.error("Error details:", JSON.stringify(e.data || e.message, null, 2));
    }

    // 3. Try to post
    try {
        console.log("Attempting to post a test tweet...");
        const result = await client.v2.tweet(`Debug test run at ${new Date().toISOString()}`);
        console.log("SUCCESS! Tweet posted. ID:", result.data.id);
    } catch (e) {
        console.error("FAILED to post tweet.");
        console.log("--- ERROR RESPONSE DATA ---");
        // This is the critical part: what does X API say exactly?
        console.log(JSON.stringify(e.data || e, null, 2));
        console.log("---------------------------");

        if (e.code === 403) {
            console.log("HINT: 403 usually means:");
            console.log("1. App permission is 'Read' (needs 'Read and Write').");
            console.log("2. Token was created BEFORE the permission change (needs re-login).");
            console.log("3. Account is locked/suspended.");
            console.log("4. Duplicate apps: You authenticated with App A but keys in .env.local are for App B.");
        }
    }
}

debugTwitter();
