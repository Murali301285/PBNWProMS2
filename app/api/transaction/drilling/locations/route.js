import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pool = await getDbConnection();
        const query = `
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
              AND T.LocationType = 'Drilling'
            ORDER BY L.LocationName ASC
        `;

        const result = await pool.request().query(query);
        return NextResponse.json(result.recordset);

    } catch (error) {
        console.error("Error fetching drilling locations:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
