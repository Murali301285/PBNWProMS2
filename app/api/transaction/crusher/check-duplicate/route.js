import { NextResponse } from 'next/server';
import { getDbConnection, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const { Date: date, ShiftId, PlantId, ExcludeSlNo } = await request.json();

        if (!date || !ShiftId || !PlantId) {
            return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        const pool = await getDbConnection();
        const reqObj = pool.request()
            .input('Date', sql.Date, date)
            .input('ShiftId', sql.Int, ShiftId)
            .input('PlantId', sql.Int, PlantId);

        let query = `
            SELECT TOP 1 
                T.SlNo,
                T.[Date],
                S.ShiftName,
                P.Name as PlantName,
                CU.UserName as CreatedByName,
                T.CreatedDate
            FROM [Trans].[TblCrusher] T 
            LEFT JOIN [Master].[TblShift] S ON T.ShiftId = S.SlNo
            LEFT JOIN [Master].[TblPlant] P ON T.PlantId = P.SlNo
            LEFT JOIN [Master].[TblUser_New] CU ON T.CreatedBy = CU.SlNo
            WHERE T.Date = @Date 
              AND T.ShiftId = @ShiftId 
              AND T.PlantId = @PlantId 
              AND T.IsDelete = 0
        `;

        if (ExcludeSlNo) {
            reqObj.input('ExcludeSlNo', sql.Int, ExcludeSlNo);
            query += ` AND T.SlNo != @ExcludeSlNo`;
        }

        const result = await reqObj.query(query);

        if (result.recordset.length > 0) {
            const entry = result.recordset[0];
            return NextResponse.json({ 
                success: true, 
                exists: true, 
                message: 'Data already exists for this combination.',
                details: {
                    date: entry.Date,
                    shift: entry.ShiftName,
                    plant: entry.PlantName,
                    enteredBy: entry.CreatedByName || 'Unknown',
                    enteredOn: entry.CreatedDate
                }
            });
        }

        return NextResponse.json({ success: true, exists: false });

    } catch (error) {
        console.error("Check Duplicate Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
