import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const { fromDate, toDate } = body;

        // 1. Validate Input
        if (!fromDate || !toDate) {
            return NextResponse.json({ message: 'From Date and To Date are required' }, { status: 400 });
        }

        // 2. Calculate Date Difference (Native JS)
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 3. Bulk Logic (> 30 Days)
        if (diffDays > 30) {
            await executeQuery(`
                INSERT INTO [Trans].[TblBulkReportRequest] 
                (ReportType, FromDate, ToDate, Status, RequestedBy, RequestedDate)
                VALUES ('HaulingMaster', @from, @to, 'Pending', 1, GETDATE())
            `, [
                { name: 'from', type: 'Date', value: fromDate },
                { name: 'to', type: 'Date', value: toDate }
            ]);
            return NextResponse.json({ message: 'Date range > 30 days. Report request submitted (Check "Generated Reports").' });
        }

        // 4. Use Stored Procedure
        const {
            shiftIds,
            operatorIds,
            haulerIds,
            haulerModelIds
        } = body;

        const toCsv = (arr) => Array.isArray(arr) ? arr.join(',') : '';

        const query = `EXEC [dbo].[PMS2_New_Sp_HaulingMasterReport] @fromDateInput, @toDateInput, @shiftIds, @operatorIds, @haulerIds, @haulerModelIds`;

        const data = await executeQuery(query, [
            { name: 'fromDateInput', value: fromDate },
            { name: 'toDateInput', value: toDate },
            { name: 'shiftIds', value: toCsv(shiftIds) },
            { name: 'operatorIds', value: toCsv(operatorIds) },
            { name: 'haulerIds', value: toCsv(haulerIds) },
            { name: 'haulerModelIds', value: toCsv(haulerModelIds) }
        ]);

        return NextResponse.json(data);

    } catch (error) {
        console.error("Report API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
