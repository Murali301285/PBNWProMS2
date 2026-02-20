
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const operators = await executeQuery(
            "SELECT SlNo as id, CONCAT(OperatorName, ' (', OperatorId, ')') as name FROM [Master].[TblOperator] WHERE IsDelete = 0 AND IsActive = 1 ORDER BY OperatorName"
        );

        const equipment = await executeQuery(
            "SELECT SlNo as id, EquipmentName as name, EquipmentGroupId FROM [Master].[TblEquipment] WHERE IsDelete = 0 AND IsActive = 1 ORDER BY EquipmentName"
        );

        const relays = await executeQuery(
            "SELECT SlNo as id, Name as name FROM [Master].[TblRelay] WHERE IsDelete = 0 AND IsActive = 1 ORDER BY Name"
        );

        return NextResponse.json({
            operators,
            equipment,
            relays
        });

    } catch (error) {
        console.error("Operator Hauling Helper API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
