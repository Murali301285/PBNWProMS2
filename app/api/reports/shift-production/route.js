import { getDbConnection, sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const { date, shiftId } = await req.json();

        if (!date || !shiftId) {
            return NextResponse.json({ success: false, message: 'Date and Shift are required' }, { status: 400 });
        }

        const pool = await getDbConnection();
        const request = pool.request();
        request.input('Date', sql.Date, date);
        request.input('ShiftId', sql.Int, shiftId);

        const result = await request.query('EXEC PMS2_New_sp_ShiftReport @Date, @ShiftId');

        // Result Sets Mapping based on SP definition:
        // 0: Incharge Details
        // 1: Section A (Coal) - Trip/Qty
        // 2: Section A (Waste) - Trip/Qty
        // 3: Section B - Loading Equipment Details
        // 4: Section C.1 - Loading Eq Coal Summary
        // 5: Section C.2 - Loading Eq Waste Summary
        // 6: Section D - Hauling Eq Coal
        // 7: Section D - Hauling Eq Waste
        // 8: Section E - Dump Wise Coal
        // 9: Section E - Dump Wise Waste

        const data = {
            incharge: result.recordsets[0] || [],
            sectionA_Coal: result.recordsets[1] || [],
            sectionA_Waste: result.recordsets[2] || [],
            sectionB_Loading: result.recordsets[3] || [],
            sectionC_Coal: result.recordsets[4] || [],
            sectionC_Waste: result.recordsets[5] || [],
            sectionD_Coal: result.recordsets[6] || [],
            sectionD_Waste: result.recordsets[7] || [],
            sectionE_Coal: result.recordsets[8] || [],
            sectionE_Waste: result.recordsets[9] || [],
            crushingDetails: result.recordsets[10] || [],
            dewateringDetails: result.recordsets[11] || [],
            inchargeDetails: { LargeScale: null, SmallScale: null }
        };

        // --- Fetch Incharge Names Manually ---
        try {
            // Priority: TblLoading -> if null try others? For now just TblLoading.
            const inchargeQuery = `
                SELECT TOP 1 
                    u1.OperatorName as LargeScaleIncharge,
                    u2.OperatorName as SmallScaleIncharge
                FROM Trans.TblLoading l
                LEFT JOIN Master.TblOperator u1 ON l.ShiftInchargeId = u1.SlNo
                LEFT JOIN Master.TblOperator u2 ON l.MidScaleInchargeId = u2.SlNo
                WHERE l.LoadingDate = @Date AND l.ShiftId = @ShiftId
                AND (l.ShiftInchargeId IS NOT NULL OR l.MidScaleInchargeId IS NOT NULL)
            `;
            const inchargeRes = await request.query(inchargeQuery);
            if (inchargeRes.recordset.length > 0) {
                data.inchargeDetails.LargeScale = inchargeRes.recordset[0].LargeScaleIncharge;
                data.inchargeDetails.SmallScale = inchargeRes.recordset[0].SmallScaleIncharge;
            }
        } catch (e) {
            console.error("Error fetching manual incharge details:", e);
        }



        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Shift Report API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
