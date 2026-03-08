import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const body = await req.json();
        const result = await executeQuery(body.sql);
        return NextResponse.json({ success: true, count: result });
    } catch (e) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
