import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import { generateContent } from './content-engine';
import { twitterClient } from './twitter';
import { getTokens, getScheduleConfig, saveScheduleConfig as saveConfigToDb } from './storage';

// Store the active job to update/cancel it
let activeJob: any | null = null;

export async function startScheduler() {
    // Only run cron locally. Vercel uses Vercel Cron (Serverless).
    if (activeJob) {
        activeJob.stop();
    }

    const config = await getScheduleConfig();
    console.log(`[Scheduler] Starting with config:`, config);

    // Validate cron syntax loosely or wrap in try-catch
    if (!cron.validate(config.time)) {
        console.error('[Scheduler] Invalid cron string:', config.time);
        return;
    }

    // Schedule the job
    activeJob = cron.schedule(config.time, async () => {
        console.log('[Scheduler] Triggering Auto-Post...');
        await executeJob(config.topic);
    });

    console.log(`[Scheduler] Started. Next run at: ${config.time}`);
}

export async function updateSchedule(time: string, topic: string) {
    const newConfig = { time, topic };
    await saveConfigToDb(newConfig);
    await startScheduler(); // Restart with new config
    return newConfig;
}

async function executeJob(topic: string) {
    console.log('[Scheduler] Executing job at:', new Date().toISOString());
    let tokens = await getTokens();

    if (!tokens || !tokens.accessToken) {
        console.error('[Scheduler] No tokens found. Skipping.');
        // Don't throw here, just return, as it might be a cron running without user setup
        return;
    }

    // --- REFRESH TOKEN CHECK ---
    // If we have a refresh token and expiration time, check validity
    if (tokens.refreshToken && tokens.expiresAt) {
        // Refresh if expiring in less than 5 minutes (or already expired)
        const EXPIRY_BUFFER = 5 * 60 * 1000;
        const timeLeft = tokens.expiresAt - Date.now();

        if (timeLeft < EXPIRY_BUFFER) {
            console.log(`[Scheduler] Token expiring in ${Math.round(timeLeft / 1000)}s. Refreshing...`);
            try {
                // Refresh the token
                const { accessToken, refreshToken, expiresIn } = await twitterClient.refreshOAuth2Token(tokens.refreshToken);

                // Update tokens structure
                tokens = {
                    accessToken,
                    // v2 usually rotates refresh tokens, so use the new one. Fallback to old if undefined (rare).
                    refreshToken: refreshToken || tokens.refreshToken,
                    expiresAt: Date.now() + (expiresIn * 1000),
                };

                // Save to DB/KV
                await import('./storage').then(m => m.saveTokens(tokens!));
                console.log('[Scheduler] Token refreshed and saved successfully.');

            } catch (err) {
                console.error('[Scheduler] Failed to refresh token:', err);
                // If refresh fails (e.g. revoked), we can't proceed with posting.
                throw new Error('Token refresh failed. Please log in again.');
            }
        }
    }

    try {
        const postContent = await generateContent(topic);
        console.log('[Scheduler] Generated content:', postContent);

        // --- POSTING LOGIC ---
        // 1. Initialize client with User's Access Token (potentially refreshed)
        const userClient = new TwitterApi(tokens.accessToken);

        // 2. Post Tweet
        const tweetResult = await userClient.v2.tweet(postContent);

        console.log('[Scheduler] Tweet posted successfully! ID:', tweetResult.data.id);

        return tweetResult.data; // Return result for test endpoint

    } catch (error: any) {
        console.error('[Scheduler] Job Failed:', error);
        if (error.data) {
            console.error('[Scheduler] Error Data:', JSON.stringify(error.data, null, 2));
        }
        throw error; // Re-throw so test endpoint sees it
    }
}
export { executeJob };
