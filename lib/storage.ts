import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const DB_PATH = path.join(process.cwd(), 'db.json');

// Types
export interface TokenData {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
}

export interface ScheduleConfig {
    time: string;
    topic: string;
}

// Helper to interact with DB (FS or KV)
const USE_KV = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

async function readDb(): Promise<any> {
    if (USE_KV) {
        // Not used for monolithic DB read in KV mode, handled per key
        return {};
    }
    if (!fs.existsSync(DB_PATH)) return {};
    return JSON.parse(await fs.promises.readFile(DB_PATH, 'utf-8'));
}

async function writeDb(data: any): Promise<void> {
    if (USE_KV) {
        // Not used for monolithic DB write in KV mode
        return;
    }
    await fs.promises.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// --- Tokens ---

export async function saveTokens(tokens: TokenData) {
    if (USE_KV) {
        await kv.set('tokens', tokens);
    } else {
        const data = await readDb();
        data.tokens = tokens;
        await writeDb(data);
    }
}

export async function getTokens(): Promise<TokenData | null> {
    if (USE_KV) {
        return await kv.get<TokenData>('tokens');
    } else {
        const data = await readDb();
        return data.tokens || null;
    }
}

export async function clearTokens() {
    // Try clearing KV
    if (!!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN) {
        try {
            await kv.del('tokens');
        } catch (e) {
            console.error('Failed to clear KV tokens', e);
        }
    }

    // Always clear local DB as fallback/cleanup
    if (fs.existsSync(DB_PATH)) {
        const data = JSON.parse(await fs.promises.readFile(DB_PATH, 'utf-8'));
        data.tokens = null;
        await writeDb(data);
    }
}

// --- Config ---

export async function getScheduleConfig(): Promise<ScheduleConfig> {
    const defaultConfig = { time: '0 9,12,15,17,21 * * *', topic: 'AI Trends' };
    if (USE_KV) {
        const config = await kv.get<ScheduleConfig>('config');
        return config || defaultConfig;
    } else {
        const data = await readDb();
        return data.config || defaultConfig;
    }
}

export async function saveScheduleConfig(config: ScheduleConfig) {
    if (USE_KV) {
        await kv.set('config', config);
    } else {
        const data = await readDb();
        data.config = config;
        await writeDb(data);
    }
}
