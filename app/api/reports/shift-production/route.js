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

        const result = await request.query('EXEC ProMS2_SPReportShiftProduction @Date, @ShiftId');

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

        // --- Fetch Crushing Details (Section F) ---
        try {
            const crusherQuery = `
                SELECT 
                    c.SlNo,
                    p.Name as EquipmentName,
                    c.RunningHr,
                    c.TotalQty,
                    0 as Budget,
                    c.TotalQty as Actual
                FROM Trans.TblCrusher c
                LEFT JOIN Master.TblPlant p ON c.PlantId = p.SlNo
                WHERE c.Date = @Date AND c.ShiftId = @ShiftId
            `;
            const crusherRes = await request.query(crusherQuery);
            data.crushingDetails = crusherRes.recordset;
        } catch (e) {
            console.error("Error fetching crusher details:", e);
            data.crushingDetails = [];
        }

        // --- Fetch Dewatering Pump Details (Section G) ---
        try {
            const dewateringQuery = `
                SELECT 
                    r.SlNo,
                    e.EquipmentName as Pump,
                    (r.EndReading - r.StartReading) as RunHr -- Assuming this calc
                FROM Trans.TblEquipmentReading r
                JOIN Master.TblEquipment e ON r.EquipmentId = e.EquipmentId
                WHERE r.ReadingDate = @Date AND r.ShiftId = @ShiftId
                AND e.ActivityId = 10 -- Pump
            `;
            const dewateringRes = await request.query(dewateringQuery);
            data.dewateringDetails = dewateringRes.recordset;
        } catch (e) {
            console.error("Error fetching dewatering details:", e);
            data.dewateringDetails = [];
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Shift Report API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
