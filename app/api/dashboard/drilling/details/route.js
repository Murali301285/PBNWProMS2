import { NextResponse } from 'next/server';
import { executeStoredProcedure, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json({ success: false, message: 'Date is required' }, { status: 400 });
        }

        const params = [
            { name: 'Date', type: sql.Date, value: date }
        ];

        const resultSets = await executeStoredProcedure('PMS2_New_Dash_SP_Drilling_Blasting_drillingDetails', params);

        return NextResponse.json({
            success: true,
            data: resultSets[0] || []
        });

    } catch (error) {
        console.error("Drilling Details API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
