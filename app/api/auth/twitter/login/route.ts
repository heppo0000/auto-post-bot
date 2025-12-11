import { twitterClient, callbackUrl } from '@/lib/twitter';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
        callbackUrl,
        { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
    );

    // Store verifier and state in cookie for the callback
    const response = NextResponse.redirect(url);
    response.cookies.set('codeVerifier', codeVerifier, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });
    response.cookies.set('state', state, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });

    return response;
}
