import { NextResponse } from 'next/server';
import { sql, getDbConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const pool = await getDbConnection();
        
        // Fetch Loading Models (ActivityId = 3)
        const loadingResult = await pool.request().query(`
            SELECT DISTINCT [Model] as model 
            FROM [Master].[TblEquipment] 
            WHERE IsDelete = 0 AND ActivityId = 3 AND [Model] IS NOT NULL AND RTRIM(LTRIM([Model])) != ''
            ORDER BY [Model] ASC
        `);
        
        // Fetch Hauling Models (ActivityId = 4)
        const haulingResult = await pool.request().query(`
            SELECT DISTINCT [Model] as model 
            FROM [Master].[TblEquipment] 
            WHERE IsDelete = 0 AND ActivityId = 4 AND [Model] IS NOT NULL AND RTRIM(LTRIM([Model])) != ''
            ORDER BY [Model] ASC
        `);

        return NextResponse.json({
            success: true,
            loadingModels: loadingResult.recordset.map(r => r.model),
            haulingModels: haulingResult.recordset.map(r => r.model)
        });

    } catch (error) {
        console.error("Fetch Analytical Models API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
