
import { NextResponse } from 'next/server';
import { executeQuery, sql } from '@/lib/db';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
    try {
        const session = await authenticateUser(request);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { Date: reqDate } = body;

        // Base query fields
        const selectClause = `
            SELECT TOP 1
                Date,
                DrillingPatchId,
                EquipmentId,
                MaterialId,
                LocationId,
                SectorId,
                ScaleId,
                StrataId,
                DepthSlabId,
                DrillingAgencyId
            FROM [Trans].[TblDrilling]
            WHERE IsDelete = 0 
            AND (CreatedBy = @userId OR UpdatedBy = @userId)
        `;

        const params = [{ name: 'userId', type: sql.Int, value: session.id }];

        // 1. Try Date Specific Match first
        let query = selectClause;
        if (reqDate) {
            query += ` AND CAST(Date AS DATE) = @date`;
            params.push({ name: 'date', type: sql.Date, value: reqDate });
        }
        query += ` ORDER BY CreatedDate DESC`;

        let data = await executeQuery(query, params);

        // 2. Fallback to Absolute Latest entered by this User if date specific yielded nothing
        if (reqDate && data.length === 0) {
            console.log("⚠️ No drilling entry found for Date. Executing User History Fallover...");
            const fallbackQuery = selectClause + ` ORDER BY CreatedDate DESC`;
            const fallbackParams = [{ name: 'userId', type: sql.Int, value: session.id }];
            data = await executeQuery(fallbackQuery, fallbackParams);
        }

        return NextResponse.json(data[0] || {});

    } catch (error) {
        console.error("Context Error:", error);
        return NextResponse.json({ message: 'Error fetching context' }, { status: 500 });
    }
}
