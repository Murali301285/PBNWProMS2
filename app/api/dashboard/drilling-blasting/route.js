import { NextResponse } from 'next/server';
import { executeStoredProcedure, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ success: false, message: 'Date required' }, { status: 400 });
        }

        console.log(`[DASH-DRILLING] Fetching stats for ${date}`);

        const params = [
            { name: 'Date', type: sql.Date, value: date }
        ];

        // Expecting multiple result sets:
        // [0]: Drilling KPIs (Shift/Day/Month Max)
        // [1]: Drilling Recovery
        // [2]: Drilling Performance List
        // [3]: Blasting Supplier
        // [4]: Blasting Explosive Summary
        // [5]: Blasting Details Log
        const resultSets = await executeStoredProcedure('PMS2_New_Dash_SP_GetDrillingBlastingStats', params);

        return NextResponse.json({
            success: true,
            drilling: {
                kpis: resultSets[0] || [], // Expecting 1-3 rows or columns
                recovery: resultSets[1] || [],
                performance: resultSets[2] || []
            },
            blasting: {
                supplier: resultSets[3] || [],
                explosive: resultSets[4] ? resultSets[4][0] || {} : {}, // Single object expectation
                details: resultSets[5] || []
            }
        });

    } catch (error) {
        console.error("Drilling Dashboard API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
