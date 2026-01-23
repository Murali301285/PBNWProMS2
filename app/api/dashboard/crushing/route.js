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

        console.log(`[DASH-CRUSHING] Fetching stats for ${fromDate} to ${toDate}`);

        const params = [
            { name: 'FromDate', type: sql.Date, value: fromDate },
            { name: 'ToDate', type: sql.Date, value: toDate }
        ];

        // Expecting multiple result sets:
        // [0]: Transactions (Production List)
        // [1]: Stoppages (Summary for Chart)
        // [2]: Stoppage Log (Detailed)
        const resultSets = await executeStoredProcedure('ProMS2_Dash_SP_GetCrushingStats', params);

        return NextResponse.json({
            success: true,
            transactions: resultSets[0] || [],
            stoppages: resultSets[1] || [],
            stoppageLog: resultSets[2] || []
        });

    } catch (error) {
        console.error("Crushing Dashboard API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
