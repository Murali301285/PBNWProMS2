import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pool = await getDbConnection();
        const query = `
            SELECT SlNo, LocationName 
            FROM [Master].[TblLocation] 
            WHERE IsDelete = 0 AND IsDestination = 1 
            ORDER BY LocationName ASC
        `;

        const result = await pool.request().query(query);
        return NextResponse.json({ success: true, data: result.recordset });

    } catch (error) {
        console.error("Error fetching dispatch locations:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
