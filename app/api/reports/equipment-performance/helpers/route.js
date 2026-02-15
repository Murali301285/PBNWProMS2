
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const activities = await executeQuery('SELECT SlNo as id, Name as name FROM [Master].[TblActivity] WHERE IsDelete = 0 AND IsActive = 1 ORDER BY Name');

        // Fetch Equipment with ActivityId to allow frontend filtering
        const equipment = await executeQuery('SELECT SlNo as id, EquipmentName as name, ActivityId FROM [Master].[TblEquipment] WHERE IsDelete = 0 AND Active = 1 ORDER BY EquipmentName');

        return NextResponse.json({
            activities,
            equipment
        });

    } catch (error) {
        console.error("Equipment Helper API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
