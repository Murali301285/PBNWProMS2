
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { fromDate, toDate, shiftId } = await req.json();

        if (!fromDate || !toDate) {
            return NextResponse.json({ success: false, message: 'From Date and To Date are required' }, { status: 400 });
        }

        const query = `EXEC ProMS2_SPReportWaterTankerEntry @FromDate = @fromDateInput, @ToDate = @toDateInput, @ShiftId = @shiftInput`;

        const data = await executeQuery(query, [
            { name: 'fromDateInput', value: fromDate },
            { name: 'toDateInput', value: toDate },
            { name: 'shiftInput', value: shiftId || null } // Pass null if 'All' or empty
        ]);

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Water Tanker Report Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
