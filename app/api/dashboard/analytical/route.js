import { NextResponse } from 'next/server';
import { executeStoredProcedure, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');

        if (!fromDate || !toDate) {
            return NextResponse.json({ success: false, message: 'Date range required' }, { status: 400 });
        }

        console.log(`[DASH-ANALYTICAL] Fetching stats for ${fromDate} to ${toDate}`);

        const params = [
            { name: 'FromDate', type: sql.Date, value: fromDate },
            { name: 'ToDate', type: sql.Date, value: toDate }
        ];

        // Expecting multiple result sets:
        // [0]: KPIs (FTD, MTD, etc.)
        // [1]: Details (Breakdown by Category)
        // [2]: Hauling Chart Data
        // [3]: Loading Chart Data
        const resultSets = await executeStoredProcedure('ProMS2_Dash_SP_GetAnalyticalStats', params);

        return NextResponse.json({
            success: true,
            kpis: resultSets[0] || [],
            details: resultSets[1] || [],
            hauling: resultSets[2] || [],
            loading: resultSets[3] || []
        });

    } catch (error) {
        console.error("Analytical Dashboard API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
