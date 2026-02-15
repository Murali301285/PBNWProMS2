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

        // Fetch Legacy Data (for other tabs)
        const legacyResultSets = await executeStoredProcedure('ProMS2_Dash_SP_GetPerformanceStats', params);

        // Fetch New Highest Production Data
        const newResultSets = await executeStoredProcedure('PMS2_New_Sp_Dash_GetPerformanceStats', params);

        return NextResponse.json({
            success: true,
            highestProduction: newResultSets[0] || [], // Use New SP result
            crusherWise: legacyResultSets[1] || [],    // Keep Legacy
            sectorWise: legacyResultSets[2] || [],     // Keep Legacy
            operatorPerformance: legacyResultSets[3] || [], // Keep Legacy
            loadingPerformance: legacyResultSets[4] || []   // Keep Legacy
        });

    } catch (error) {
        console.error("Performance Dashboard API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
