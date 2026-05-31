import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(req) {
    try {
        const body = await req.json();
        const { Date: reqDate } = body; // Optional Date filter

        // Base query fields
        const selectClause = `
            SELECT TOP 1
                t.SlNo,
                t.Date,
                t.DispatchLocationId,
                t.Trip,
                t.TotalQty,
                t.UOMId,
                t.Remarks,
                t.CreatedBy,
                t.CreatedDate
            FROM [Trans].[TblDispatchEntry] t
            WHERE t.isDelete = 0
        `;

        const params = {};

        // 1. Try Date Specific Match first
        let query = selectClause;
        if (reqDate) {
            query += ` AND CAST(t.Date AS DATE) = @Date`;
            params.Date = reqDate;
        }
        query += ` ORDER BY t.SlNo DESC`;

        let data = await executeQuery(query, params);

        // 2. Fallback to Absolute Latest recorded in the DB across all users
        if (reqDate && data.length === 0) {
            console.log("⚠️ No dispatch entry found for Date. Executing Global History Fallover...");
            const fallbackQuery = selectClause + ` ORDER BY t.SlNo DESC`;
            data = await executeQuery(fallbackQuery, {});
        }

        return NextResponse.json({
            success: true,
            data: data.length > 0 ? data[0] : null
        });

    } catch (error) {
        console.error("Dispatch Entry Last Context Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
