import { twitterClient, callbackUrl } from '@/lib/twitter';
import { saveTokens } from '@/lib/storage';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const code = searchParams.get('code');

    const storedState = request.cookies.get('state')?.value;
    const codeVerifier = request.cookies.get('codeVerifier')?.value;

    if (!state || !code || !storedState || !codeVerifier || state !== storedState) {
        return NextResponse.json({ error: 'Invalid state or missing params' }, { status: 400 });
    }

    try {
        const { accessToken, refreshToken, expiresIn } = await twitterClient.loginWithOAuth2({
            code,
            codeVerifier,
            redirectUri: callbackUrl,
        });

        // 4. Save tokens
        await saveTokens({
            accessToken,
            refreshToken,
            expiresAt: Date.now() + expiresIn * 1000,
        });

        return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
        console.error('Login failed', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
