
import { executeStoredProcedure } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const body = await req.json();
        const { date, operatorIds, haulingMachineIds, relayIds, shiftIds } = body;

        console.log("Operator Hauling Report Request:", { date, operatorIds });

        const params = [
            { name: 'FromDate', value: date },
            { name: 'ToDate', value: date },
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
