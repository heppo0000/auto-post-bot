import cron from 'node-cron';
import { TwitterApi } from 'twitter-api-v2';
import { generateContent } from './content-engine';
import { twitterClient } from './twitter';
import { getTokens, getScheduleConfig, saveScheduleConfig as saveConfigToDb } from './storage';

// Store the active job to update/cancel it
let activeJob: cron.ScheduledTask | null = null;

export async function startScheduler() {
    // Only run cron locally. Vercel uses Vercel Cron (Serverless).
    // We can check NODE_ENV or just let it run if it's a long-running process.
    // In Vercel Serverless, this might run once then die, which is fine as we rely on Vercel Cron there.
    // For local dev, we want this.

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
    const tokens = await getTokens();
    if (!tokens || !tokens.accessToken) {
        console.error('[Scheduler] No tokens found. Skipping.');
        return;
    }

    try {
        const postContent = await generateContent(topic);
        console.log('[Scheduler] Generated content:', postContent);

        // --- POSTING LOGIC ---
        // 1. Initialize client with User's Access Token
        const userClient = new TwitterApi(tokens.accessToken);

        // 2. Post Tweet
        // Note: If token is expired, this will fail. PROD would handle refresh.
        // For verify, we act as if token is fresh (it should be since user just logged in).
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
