import { executeJob } from '@/lib/scheduler';
import { getScheduleConfig } from '@/lib/storage';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    // 1. Verify caller (Optional but recommended)
    // Vercel sends `x-vercel-cron: "1"`
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // If CRON_SECRET is set, require it.
        // For simple usage without secret, we can skip or check x-vercel-cron
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        console.log('[Cron] Triggered via Vercel Cron');

        // 2. Get current topic
        const config = await getScheduleConfig();

        // 3. Execute
        const result = await executeJob(config.topic);

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('[Cron] Failed:', error);
        return NextResponse.json({ error: error.message || 'Cron Failed' }, { status: 500 });
    }
}
