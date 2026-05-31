
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
                t.Date,
                t.BlastingPatchId,
                t.SMESupplierId,
                t.SMEQty,
                t.MaxChargeHole as MaxCharge, -- Alias to match Form
                t.PPV,
                t.NoofHolesDeckCharged as DeckHoles, -- Alias
                t.NoofWetHole as WetHoles, -- Alias
                t.AirPressure
            FROM [Trans].[TblBlasting] t
            WHERE t.IsDelete = 0 
            AND (t.CreatedBy = @userId OR t.UpdatedBy = @userId)
        `;

        const params = [{ name: 'userId', type: sql.Int, value: session.id }];

        // 1. Try Date Specific Match first
        let query = selectClause;
        if (reqDate) {
            // Date Specific Context
            query += ` AND CAST(t.Date AS DATE) = @date`;
            params.push({ name: 'date', type: sql.Date, value: reqDate });
        }
        query += ` ORDER BY t.SlNo DESC`;

        let data = await executeQuery(query, params);

        // 2. Fallback to Absolute Latest entered by this User if date specific yielded nothing
        if (reqDate && data.length === 0) {
            console.log("⚠️ No blasting entry found for Date. Executing User History Fallover...");
            const fallbackQuery = selectClause + ` ORDER BY t.SlNo DESC`;
            const fallbackParams = [{ name: 'userId', type: sql.Int, value: session.id }];
            data = await executeQuery(fallbackQuery, fallbackParams);
        }

        return NextResponse.json(data[0] || {});

    } catch (error) {
        console.error("Blasting Context Error:", error);
        return NextResponse.json({ message: 'Error fetching context' }, { status: 500 });
    }
}
