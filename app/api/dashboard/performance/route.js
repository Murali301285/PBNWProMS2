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

        console.log(`[DASH-PERFORMANCE] Fetching stats for ${fromDate} to ${toDate}`);

        const params = [
            { name: 'FromDate', type: sql.Date, value: fromDate },
            { name: 'ToDate', type: sql.Date, value: toDate }
        ];

        // Expecting multiple result sets:
        // [0]: Highest Production (Category, Qty, etc.)
        // [1]: Crusher Wise (Plant, Qty)
        // [2]: Sector Wise (Plant, Qty)
        // [3]: Operator Performance (Loading/Hauling)
        // [4]: Loading Performance (Loading/Hauling Efficiency)
        const resultSets = await executeStoredProcedure('ProMS2_Dash_SP_GetPerformanceStats', params);

        return NextResponse.json({
            success: true,
            highestProduction: resultSets[0] || [],
            crusherWise: resultSets[1] || [],
            sectorWise: resultSets[2] || [],
            operatorPerformance: resultSets[3] || [],
            loadingPerformance: resultSets[4] || []
        });

    } catch (error) {
        console.error("Performance Dashboard API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
