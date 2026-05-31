
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
        const userId = session.id;

        // Base query fields
        const selectClause = `
            SELECT TOP 1
                t.SlNo,
                t.Date,
                t.ShiftId,
                t.RelayId,
                t.PlantId,
                t.EquipmentId,
                t.UnitId,
                t.OMR,
                t.CMR,
                t.TotalUnit,
                t.Remarks,
                t.Type, -- Critical: Copy Type (Equipment/Plant)
                t.CreatedBy,
                t.CreatedDate
            FROM [Trans].[TblElectricalEntry] t
            WHERE t.IsDelete = 0 
            AND (t.CreatedBy = @userId OR t.UpdatedBy = @userId)
        `;

        const params = [{ name: 'userId', type: sql.Int, value: userId }];

        // 1. Try Date Specific Match first
        let query = selectClause;
        if (body.Date) {
            // Check Specific Date
            query += ` AND CAST(t.Date AS DATE) = @date`;
            params.push({ name: 'date', type: sql.Date, value: body.Date });
        }
        query += ` ORDER BY t.SlNo DESC`;

        let data = await executeQuery(query, params);

        // 2. Fallback to Absolute Latest entered by this User if date specific yielded nothing
        if (body.Date && data.length === 0) {
            console.log("⚠️ No electrical entry found for Date. Executing User History Fallover...");
            const fallbackQuery = selectClause + ` ORDER BY t.SlNo DESC`;
            const fallbackParams = [{ name: 'userId', type: sql.Int, value: userId }];
            data = await executeQuery(fallbackQuery, fallbackParams);
        }

        return NextResponse.json({ data: data[0] || null });

    } catch (error) {
        console.error("Electrical Context Error:", error);
        return NextResponse.json({ message: 'Error fetching context', error: error.message }, { status: 500 });
    }
}
