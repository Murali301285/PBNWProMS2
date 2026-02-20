
import { executeStoredProcedure } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const body = await req.json();
        const { fromDate, toDate, operatorIds } = body;

        console.log("Operator Report Request:", { fromDate, toDate, operatorIds });

        const params = [
            { name: 'FromDate', value: fromDate },
            { name: 'ToDate', value: toDate },
            { name: 'OperatorIds', value: operatorIds && operatorIds.length > 0 ? operatorIds.join(',') : null }
        ];

        // executeStoredProcedure returns result.recordsets (array of arrays)
        // PMS2_New_Sp_OperatorPerformanceLoadingReport returns 1 result set
        const resultSets = await executeStoredProcedure(
            '[dbo].[PMS2_New_Sp_OperatorPerformanceLoadingReport]',
            params
        );

        const data = resultSets && resultSets.length > 0 ? resultSets[0] : [];
        console.log(`Fetched ${data.length} rows`);

        return NextResponse.json(data);

    } catch (error) {
        console.error("Operator Report API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
