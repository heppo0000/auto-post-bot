import { getTokens } from '@/lib/storage';
import { generateContent } from '@/lib/content-engine';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const { topic } = await request.json();

    if (!topic) {
        return NextResponse.json({ error: 'Missing topic' }, { status: 400 });
    }

    const tokens = getTokens();
    if (!tokens?.accessToken) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Call the scheduler's job execution logic directly
        // This handles generation AND posting
        // We need to import executeJob from scheduler
        // Note: executeJob is now async and returns data (or throws)

        // Import dynamically to avoid circular usage if any (though route -> lib is fine)
        const { executeJob } = await import('@/lib/scheduler');
        const result = await executeJob(topic); // Content generation + Tweet

        // Since executeJob posts, we return the result
        return NextResponse.json({ success: true, content: 'Tweet Posted! ID: ' + result?.id });
    } catch (error) {
        console.error('Test Generation Error:', error);
        return NextResponse.json({ error: 'Generation failed', details: String(error) }, { status: 500 });
    }
}
