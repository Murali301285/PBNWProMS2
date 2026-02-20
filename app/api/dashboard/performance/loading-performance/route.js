import { NextResponse } from 'next/server';
import { executeStoredProcedure, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const model = searchParams.get('model');
        const capacity = searchParams.get('capacity');
        const shiftId = searchParams.get('shiftId');
        const type = searchParams.get('type') || 'Both'; // 'Loading', 'Hauling', 'Both'

        if (!fromDate || !toDate) {
            return NextResponse.json({ success: false, message: 'Date range required' }, { status: 400 });
        }

        console.log(`[DASH-LOAD-PERF] Fetching stats for ${fromDate} to ${toDate} | Model: ${model} | Cap: ${capacity} | Shift: ${shiftId} | Type: ${type}`);

        const params = [
            { name: 'FromDate', type: sql.Date, value: fromDate },
            { name: 'ToDate', type: sql.Date, value: toDate },
            { name: 'Model', type: sql.VarChar(100), value: model || null },
            { name: 'Capacity', type: sql.VarChar(100), value: capacity || null },
            { name: 'ShiftId', type: sql.Int, value: shiftId ? parseInt(shiftId) : null },
            { name: 'ActivityType', type: sql.VarChar(20), value: type }
        ];

        const resultSets = await executeStoredProcedure('PMS2_New_Dash_SP_Performance_LoadingPerformance', params);

        return NextResponse.json({
            success: true,
            data: resultSets[0] || []
        });

    } catch (error) {
        console.error("Loading Performance API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
