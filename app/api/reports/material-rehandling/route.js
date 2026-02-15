import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            fromDate,
            toDate,
            shiftIds,
            sourceIds,
            destinationIds,
            haulerIds,
            loadingMachineIds,
            materialIds,
            relayIds,
            scaleIds,
            sectorIds,
            patchIds,
            shiftInchargeIds,  // New
            midScaleInchargeIds // New
        } = body;

        if (!fromDate || !toDate) {
            return NextResponse.json({ success: false, message: 'Date range is required' }, { status: 400 });
        }

        // Helper to join array to string or null
        const toCsv = (arr) => (Array.isArray(arr) && arr.length > 0) ? arr.join(',') : null;

        const query = `
            EXEC PMS2_New_Sp_MaterialRehandlingReport 
            @FromDate = @fromDate, 
            @ToDate = @toDate,
            @ShiftIds = @shiftIds,
            @SourceIds = @sourceIds,
            @DestinationIds = @destinationIds,
            @HaulerIds = @haulerIds,
            @LoadingMachineIds = @loadingMachineIds,
            @MaterialIds = @materialIds,
            @RelayIds = @relayIds,
            @ScaleIds = @scaleIds,
            @SectorIds = @sectorIds,
            @PatchIds = @patchIds,
            @ShiftInchargeIds = @shiftInchargeIds,
            @MidScaleInchargeIds = @midScaleInchargeIds
        `;

        const data = await executeQuery(query, [
            { name: 'fromDate', value: fromDate },
            { name: 'toDate', value: toDate },
            { name: 'shiftIds', value: toCsv(shiftIds) },
            { name: 'sourceIds', value: toCsv(sourceIds) },
            { name: 'destinationIds', value: toCsv(destinationIds) },
            { name: 'haulerIds', value: toCsv(haulerIds) },
            { name: 'loadingMachineIds', value: toCsv(loadingMachineIds) },
            { name: 'materialIds', value: toCsv(materialIds) },
            { name: 'relayIds', value: toCsv(relayIds) },
            { name: 'scaleIds', value: toCsv(scaleIds) },
            { name: 'sectorIds', value: toCsv(sectorIds) },
            { name: 'patchIds', value: toCsv(patchIds) },
            { name: 'shiftInchargeIds', value: toCsv(shiftInchargeIds) },
            { name: 'midScaleInchargeIds', value: toCsv(midScaleInchargeIds) }
        ]);

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Material Rehandling Report Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
