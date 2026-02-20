import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pool = await getDbConnection();

        const modelsRes = await pool.request().query("SELECT DISTINCT Model FROM Master.TblEquipment WHERE IsDelete = 0 AND Model IS NOT NULL ORDER BY Model");
        const capacitiesRes = await pool.request().query("SELECT DISTINCT Capacity FROM Master.TblEquipment WHERE IsDelete = 0 AND Capacity IS NOT NULL ORDER BY Capacity");
        const shiftsRes = await pool.request().query("SELECT SlNo, ShiftName FROM Master.TblShift WHERE IsDelete = 0 ORDER BY SlNo");

        return NextResponse.json({
            success: true,
            models: modelsRes.recordset.map(r => r.Model),
            capacities: capacitiesRes.recordset.map(r => r.Capacity),
            shifts: shiftsRes.recordset
        });

    } catch (error) {
        console.error("Filter Options API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
