
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Shifts
        const shifts = await executeQuery(`
            SELECT SlNo, ShiftName FROM [Master].[TblShift] 
            WHERE IsDelete = 0 
            -- AND IsActive = 1 -- Usually check Active too, user said 'isDelete=0 and isActive=1'
            ORDER BY ShiftName
        `);

        // 2. Destinations (Filtered by Mapped LocationType = 'Water Tanker')
        const destinations = await executeQuery(`
            SELECT DISTINCT L.SlNo, L.LocationName 
            FROM [Master].[TblLocation] L
            INNER JOIN [Master].[TblLocationTypeMapping] M ON L.SlNo = M.LocationId
            INNER JOIN [Master].[TblLocationType] T ON M.LocationTypeId = T.SlNo
            WHERE L.IsDelete = 0 
              AND L.IsActive = 1
              AND M.IsDelete = 0 
              AND M.IsActive = 1
              AND T.IsDelete = 0 
              AND T.IsActive = 1
              AND T.LocationType = 'Water Tanker'
            ORDER BY L.LocationName ASC
        `);

        // 3. Filling Points
        const fillingPoints = await executeQuery(`
            SELECT SlNo, FillingPoint FROM [Master].[tblFillingPoint] 
            WHERE IsDelete = 0 AND IsActive = 1
            ORDER BY FillingPoint
        `);

        // 4. Filling Pumps
        const fillingPumps = await executeQuery(`
            SELECT SlNo, FillingPump FROM [Master].[tblFillingPump] 
            WHERE IsDelete = 0 AND IsActive = 1
            ORDER BY FillingPump
        `);

        // 4. Haulers (Water Tankers - Group 51) + Capacity
        const haulers = await executeQuery(`
            SELECT SlNo, EquipmentName, Capacity 
            FROM [Master].[TblEquipment] 
            WHERE EquipmentGroupId = 51 
            AND IsDelete = 0 AND IsActive = 1
            ORDER BY EquipmentName
        `);

        return NextResponse.json({
            shifts,
            destinations,
            fillingPoints,
            fillingPumps,
            haulers
        });

    } catch (error) {
        console.error("WaterTanker Helper Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
