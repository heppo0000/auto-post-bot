```javascript
import { getTokens } from '@/lib/storage';
import { NextResponse } from 'next/server';

export async function GET() {
    const tokens = await getTokens();
    const isConnected = !!tokens?.accessToken;
    return NextResponse.json({
        isConnected: isConnected,
        expiresAt: tokens?.expiresAt
    });
}
```
