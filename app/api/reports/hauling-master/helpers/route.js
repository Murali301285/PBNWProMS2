import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const shifts = await executeQuery('SELECT SlNo as id, ShiftName as name FROM [Master].[TblShift] WHERE IsDelete = 0 ORDER BY ShiftName').catch(err => { console.error("Shifts Query Error:", err); return []; });
        const operators = await executeQuery('SELECT SlNo as id, OperatorName as name FROM [Master].[TblOperator] WHERE IsDelete = 0 ORDER BY OperatorName').catch(err => { console.error("Operators Query Error:", err); return []; });

        // Try Haulers (Equipment type 2 or ActivityId=4 per Material Loading Report)
        const haulers = await executeQuery('SELECT SlNo as id, EquipmentName as name FROM [Master].[TblEquipment] WHERE IsDelete = 0 AND ActivityId = 4 ORDER BY EquipmentName').catch(err => { console.error("Haulers Query Error:", err); return []; });

        // Try Hauler Models (EquipmentGroup for Haulers - usually joined via equipment or assume same ActivityId context)
        // Since TblEquipmentGroup doesn't strictly have ActivityId in all schemas, we stick to our fallback logic or use ActivityId if available.
        // Let's assume for now we use the safer fallback approach for Models, but try ActivityId if logical, or just fetch all for now to be safe as per previous success.
        // Actually, let's look at TblEquipmentGroup schema? No, avoiding extra queries.
        // Material Loading Report doesn't filter Models. 
        // Let's stick to the fallback logic which works, but maybe try EquipmentTypeId=2 OR ActivityId=4 if that column exists?
        // Safest is the fallback we already have, but maybe the PRIMARY query should avail of ActivityId if EquipmentTypeId fails?
        // User said "Take reference from Material Loading". Material Loading doesn't fetch Models.
        // So for Haulers, WE MUST USE ActivityId=4.

        let haulerModels = [];
        try {
            // Try fetching Groups that are linked to Haulers? 
            // Or just fetch all. The user didn't complain about Models, just Haulers.
            // But to be consistent, let's just fetch all or filter by what we know.
            // Let's keep the previous logic for Models but using ActivityId=4? TblEquipmentGroup might not have ActivityId.
            // Let's start with the specific request: Hauler -> ActivityId=4
            haulerModels = await executeQuery("SELECT DISTINCT Model as id, Model as name FROM [Master].[TblEquipment] WHERE IsDelete = 0 AND ActivityId = 4 AND Model IS NOT NULL AND Model <> '' ORDER BY Model ASC");
        } catch (err) {
            console.error("Hauler Models Query Error:", err);
            haulerModels = [];
        }

        return NextResponse.json({
            shifts: shifts || [],
            operators: operators || [],
            haulers: haulers || [],
            haulerModels: haulerModels || []
        });

    } catch (error) {
        console.error("Helper API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
