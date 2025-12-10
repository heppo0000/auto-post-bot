import { getScheduleConfig } from '@/lib/storage';
import { updateSchedule } from '@/lib/scheduler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    const config = await getScheduleConfig();
    return NextResponse.json(config);
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { time, topic } = body;

    if (!time || !topic) {
        return NextResponse.json({ error: 'Missing time or topic' }, { status: 400 });
    }

    try {
        await updateSchedule(time, topic);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
    }
}
