import { clearTokens } from '@/lib/storage';
import { NextResponse } from 'next/server';

export async function POST() {
    await clearTokens();
    const response = NextResponse.json({ success: true });

    // Also clear cookies if any (though we primarily use db.json)
    response.cookies.delete('codeVerifier');
    response.cookies.delete('state');

    return response;
}
