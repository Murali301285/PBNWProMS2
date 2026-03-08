import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const pool = await getDbConnection();
        const requestSql = pool.request();

        const query = `
            SELECT DISTINCT [VehicleNo]
            FROM [Trans].[TblBDSEntry]
            WHERE IsDelete = 0 AND VehicleNo IS NOT NULL AND VehicleNo != ''
            ORDER BY [VehicleNo] ASC
        `;

        const result = await requestSql.query(query);

        // Map immediately to the format required by react-select
        const options = result.recordset.map(record => ({
            value: record.VehicleNo,
            label: record.VehicleNo
        }));

        return NextResponse.json({
            success: true,
            data: options
        });

    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch vehicle list' }, { status: 500 });
    }
}
