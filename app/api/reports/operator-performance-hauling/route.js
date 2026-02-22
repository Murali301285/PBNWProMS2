
import { executeStoredProcedure } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const body = await req.json();
        const { fromDate, toDate, operatorIds, haulingMachineIds, relayIds, shiftIds } = body;

        console.log("Operator Hauling Report Request:", { fromDate, toDate, operatorIds });

        const params = [
            { name: 'FromDate', value: fromDate },
            { name: 'ToDate', value: toDate },
            { name: 'ShiftIds', value: shiftIds && shiftIds.length > 0 ? shiftIds.join(',') : null },
            { name: 'OperatorIds', value: operatorIds && operatorIds.length > 0 ? operatorIds.join(',') : null },
            { name: 'HaulingMachineIds', value: haulingMachineIds && haulingMachineIds.length > 0 ? haulingMachineIds.join(',') : null },
            { name: 'RelayIds', value: relayIds && relayIds.length > 0 ? relayIds.join(',') : null }
        ];

        const resultSets = await executeStoredProcedure(
            '[dbo].[PMS2_New_Sp_OperatorPerformanceHaulingReport]',
            params
        );

        const data = resultSets && resultSets.length > 0 ? resultSets[0] : [];
        console.log(`Fetched ${data.length} rows`);

        return NextResponse.json(data);

    } catch (error) {
        console.error("Operator Hauling Report API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
