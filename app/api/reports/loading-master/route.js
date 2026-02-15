import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            fromDate,
            toDate,
            shiftIds,
            operatorIds,
            loadingMachineIds,
            loadingModelIds,
            relayIds,
            sectorIds,
            patchIds,
            methodIds
        } = body;

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
                VALUES ('LoadingMaster', @from, @to, 'Pending', 1, GETDATE())
            `, [
                { name: 'from', type: 'Date', value: fromDate },
                { name: 'to', type: 'Date', value: toDate }
            ]);
            return NextResponse.json({ message: 'Date range > 30 days. Report request submitted (Check "Generated Reports").' });
        }

        // 4. Stored Procedure with Filter Params
        // Helper to join array to string or null
        const toCsv = (arr) => (Array.isArray(arr) && arr.length > 0) ? arr.join(',') : null;

        const query = `
            EXEC PMS2_New_Sp_LoadingMasterReport 
            @FromDate = @fromDate, 
            @ToDate = @toDate,
            @ShiftIds = @shiftIds,
            @OperatorIds = @operatorIds,
            @LoadingMachineIds = @loadingMachineIds,
            @LoadingModelIds = @loadingModelIds,
            @RelayIds = @relayIds,
            @SectorIds = @sectorIds,
            @PatchIds = @patchIds,
            @MethodIds = @methodIds
        `;

        const data = await executeQuery(query, [
            { name: 'fromDate', value: fromDate },
            { name: 'toDate', value: toDate },
            { name: 'shiftIds', value: toCsv(shiftIds) },
            { name: 'operatorIds', value: toCsv(operatorIds) },
            { name: 'loadingMachineIds', value: toCsv(loadingMachineIds) },
            { name: 'loadingModelIds', value: toCsv(loadingModelIds) },
            { name: 'relayIds', value: toCsv(relayIds) },
            { name: 'sectorIds', value: toCsv(sectorIds) },
            { name: 'patchIds', value: toCsv(patchIds) },
            { name: 'methodIds', value: toCsv(methodIds) }
        ]);

        return NextResponse.json(data);

    } catch (error) {
        console.error("Report API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
