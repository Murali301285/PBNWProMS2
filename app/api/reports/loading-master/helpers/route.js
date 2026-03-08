import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Fetching filter data for Loading Master Report...");

        const [
            shifts,
            operators,
            loadingMachines,
            loadingModels,
            relays,
            sectors,
            patches,
            methods
        ] = await Promise.all([
            executeQuery('SELECT SlNo as id, ShiftName as name FROM [Master].[TblShift] WHERE IsActive=1 AND IsDelete=0 ORDER BY ShiftName'),
            executeQuery('SELECT SlNo as id, OperatorName as name FROM [Master].[TblOperator] WHERE IsActive=1 AND IsDelete=0 ORDER BY OperatorName'),
            // Loading Machines ActivityId=3 per Loading Report context. Or use 4? 
            // In SP create_sp_material_loading_report.sql ActivityId=3 for Loading. 
            // In `create_sp_loading_master_report.sql` from route.js: `ActivityId INT = 4` (to exclude ActivityId != 4).
            // This is strange. The original SQL said `WHERE T0.IsDelete=0 AND T0.ActivityId != 4`.
            // ActivityId 4 is usually Hauling. So Loading Master includes anything NOT Hauling (Loaders).
            // So for loadingMachines, fetching distinct ActivityId used by these machines would be best, but ActivityId 3 is standard for Loading.
            executeQuery('SELECT SlNo as id, EquipmentName as name FROM [Master].[TblEquipment] WHERE IsActive=1 AND IsDelete=0 AND ActivityId=3 ORDER BY EquipmentName'),
            executeQuery("SELECT DISTINCT Model as id, Model as name FROM [Master].[TblEquipment] WHERE IsActive=1 AND IsDelete=0 AND ActivityId=3 AND Model IS NOT NULL AND Model <> '' ORDER BY Model ASC"),
            executeQuery('SELECT SlNo as id, Name as name FROM [Master].[TblRelay] WHERE IsActive=1 AND IsDelete=0 ORDER BY Name'),
            executeQuery('SELECT SlNo as id, SectorName as name FROM [Master].[TblSector] WHERE IsActive=1 AND IsDelete=0 ORDER BY SectorName'),
            executeQuery('SELECT SlNo as id, Name as name FROM [Master].[TblPatch] WHERE IsActive=1 AND IsDelete=0 ORDER BY Name'),
            executeQuery('SELECT SlNo as id, Name as name FROM [Master].[TblMethod] WHERE IsActive=1 AND IsDelete=0 ORDER BY Name')
        ]);

        return NextResponse.json({
            success: true,
            data: {
                shifts,
                operators,
                loadingMachines,
                loadingModels,
                relays,
                sectors,
                patches,
                methods
            }
        });

    } catch (error) {
        console.error("Loading Master Filter Helper Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
