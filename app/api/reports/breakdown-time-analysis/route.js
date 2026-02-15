import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';

export async function POST(request) {
    try {
        const { fromDate, toDate } = await request.json();

        if (!fromDate || !toDate) {
            return NextResponse.json({ success: false, message: "From Date and To Date are required" }, { status: 400 });
        }

        const pool = await getDbConnection();

        const result = await pool.request()
            .input('FromDate', sql.Date, fromDate)
            .input('ToDate', sql.Date, toDate)
            .execute('Report.ProMS2_New_Sp_BreakdownTimeAnalysisReport');

        return NextResponse.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("Report Generation Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
