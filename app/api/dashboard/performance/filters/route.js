import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // 'Loading', 'Hauling', or 'ShiftsOnly'
        const pool = await getDbConnection();

        if (type === 'ShiftsOnly') {
            const shiftsRes = await pool.request().query("SELECT SlNo, ShiftName FROM Master.TblShift WHERE IsDelete = 0 ORDER BY SlNo");
            return NextResponse.json({
                success: true,
                shifts: shiftsRes.recordset
            });
        }

        let activityId = 3; // Default Loading
        if (type === 'Hauling') activityId = 4;

        const modelsRes = await pool.request()
            .input('activityId', activityId)
            .query("SELECT DISTINCT Model FROM Master.TblEquipment WHERE ActivityId = @activityId AND IsDelete = 0 AND Model IS NOT NULL ORDER BY Model");

        const capacitiesRes = await pool.request()
            .input('activityId', activityId)
            .query("SELECT DISTINCT Capacity FROM Master.TblEquipment WHERE ActivityId = @activityId AND IsDelete = 0 AND Capacity IS NOT NULL ORDER BY Capacity");

        return NextResponse.json({
            success: true,
            models: modelsRes.recordset.map(r => r.Model),
            capacities: capacitiesRes.recordset.map(r => r.Capacity)
        });

    } catch (error) {
        console.error("Filter Options API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
