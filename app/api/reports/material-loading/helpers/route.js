import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Fetching filter data for Material Loading Report...");

        const [
            shifts,
            sources,
            destinations,
            haulers,
            loaders,
            materials,
            relays,
            scales,
            sectors,
            patches,
            incharges
        ] = await Promise.all([
            executeQuery('SELECT SlNo as id, ShiftName as name FROM [Master].[TblShift] WHERE IsActive=1 AND IsDelete=0 ORDER BY ShiftName'),
            executeQuery('SELECT SlNo as id, Name as name FROM [Master].[TblSource] WHERE IsActive=1 AND IsDelete=0 ORDER BY Name'),
            executeQuery('SELECT SlNo as id, Name as name FROM [Master].[TblDestination] WHERE IsActive=1 AND IsDelete=0 ORDER BY Name'),
            executeQuery('SELECT SlNo as id, EquipmentName as name FROM [Master].[TblEquipment] WHERE IsActive=1 AND IsDelete=0 AND ActivityId=4 ORDER BY EquipmentName'), // Haulers
            executeQuery('SELECT SlNo as id, EquipmentName as name FROM [Master].[TblEquipment] WHERE IsActive=1 AND IsDelete=0 AND ActivityId=3 ORDER BY EquipmentName'), // Loaders
            executeQuery('SELECT SlNo as id, MaterialName as name FROM [Master].[TblMaterial] WHERE IsActive=1 AND IsDelete=0 ORDER BY MaterialName'),
            executeQuery('SELECT SlNo as id, Name as name FROM [Master].[TblRelay] WHERE IsActive=1 AND IsDelete=0 ORDER BY Name'),
            executeQuery('SELECT SlNo as id, Name as name FROM [Master].[TblScale] WHERE IsActive=1 AND IsDelete=0 ORDER BY Name'),
            executeQuery('SELECT SlNo as id, SectorName as name FROM [Master].[TblSector] WHERE IsActive=1 AND IsDelete=0 ORDER BY SectorName'),
            executeQuery('SELECT SlNo as id, Name as name FROM [Master].[TblPatch] WHERE IsActive=1 AND IsDelete=0 ORDER BY Name'),
            executeQuery('SELECT SlNo as id, OperatorName as name FROM [Master].[TblOperator] WHERE IsActive=1 AND IsDelete=0 AND SubCategoryId=1 ORDER BY OperatorName') // Incharges
        ]);

        return NextResponse.json({
            success: true,
            data: {
                shifts,
                sources,
                destinations,
                haulers,
                loaders,
                materials,
                relays,
                scales,
                sectors,
                patches,
                incharges
            }
        });

    } catch (error) {
        console.error("Material Loading Filter Helper Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
