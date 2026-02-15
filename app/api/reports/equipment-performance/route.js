
import { executeQuery } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const body = await req.json();
        const { date, activityIds, equipmentIds } = body;

        if (!date) {
            return NextResponse.json({ success: false, message: 'Date is required' }, { status: 400 });
        }

        // Helper to formatting array to CSV
        const toCsv = (arr) => (Array.isArray(arr) && arr.length > 0) ? arr.join(',') : null;

        const query = `
            EXEC PMS2_New_Sp_EquipmentPerformanceReport 
            @Date = @date, 
            @ActivityIds = @activityIds,
            @EquipmentIds = @equipmentIds
        `;

        const data = await executeQuery(query, [
            { name: 'date', type: 'Date', value: date },
            { name: 'activityIds', value: toCsv(activityIds) },
            { name: 'equipmentIds', value: toCsv(equipmentIds) }
        ]);

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Equipment Report API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
