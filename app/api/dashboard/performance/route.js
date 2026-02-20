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

        // Fetch All Performance Data from Single New SP
        const resultSets = await executeStoredProcedure('PMS2_New_Dash_SP_PerformanceDashboard', params);

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
