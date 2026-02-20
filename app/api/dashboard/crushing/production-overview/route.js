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

        const params = [
            { name: 'FromDate', type: sql.Date, value: fromDate },
            { name: 'ToDate', type: sql.Date, value: toDate }
        ];

        const resultSets = await executeStoredProcedure('PMS2_New_Dash_SP_Crushing_ProductionOverview', params);

        return NextResponse.json({
            success: true,
            data: resultSets[0] || []
        });

    } catch (error) {
        console.error("Crushing Overview API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
