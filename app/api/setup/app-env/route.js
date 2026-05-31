import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        return NextResponse.json({ env: process.env.env || '' });
    } catch (error) {
        console.error("Error fetching runtime app environment:", error);
        return NextResponse.json({ env: '' }, { status: 500 });
    }
}
