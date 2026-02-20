import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import sql from 'mssql';

// GET: Fetch Shifts for Dropdown
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        const pool = await getDbConnection();

        if (type === 'shifts') {
            const result = await pool.request().query("SELECT SlNo, ShiftName FROM Master.TblShift WHERE IsActive = 1 ORDER BY SlNo");
            return NextResponse.json({ success: true, data: result.recordset });
        }

        if (type === 'breakdown') {
            const date = searchParams.get('date');
            const shiftId = searchParams.get('shiftId');

            if (!date || !shiftId) {
                return NextResponse.json({ success: false, message: "Date and ShiftId required" }, { status: 400 });
            }

            const result = await pool.request()
                .input('Date', sql.Date, date)
                .input('ShiftId', sql.Int, shiftId)
                .query("SELECT * FROM Report.TblBreakdownEntry WHERE Date = @Date AND ShiftId = @ShiftId");

            return NextResponse.json({ success: true, data: result.recordset[0] || null });
        }

        return NextResponse.json({ success: false, message: "Invalid Request" });

    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST: Generate Report Data & Save Breakdown
export async function POST(request) {
    try {
        const { date, shiftId, shiftChange, breakTime, blasting, others } = await request.json();

        if (!date || !shiftId) {
            return NextResponse.json({ success: false, message: "Date and Shift are required" }, { status: 400 });
        }

        const pool = await getDbConnection();

        // 1. Save/Upsert Breakdown Data
        const upsertQuery = `
            MERGE INTO Report.TblBreakdownEntry AS Target
            USING (VALUES (@Date, @ShiftId)) AS Source (Date, ShiftId)
            ON Target.Date = Source.Date AND Target.ShiftId = Source.ShiftId
            WHEN MATCHED THEN
                UPDATE SET 
                    ShiftChangeTime = @ShiftChange,
                    Break_TeaTime = @BreakTime,
                    BlastingTime = @Blasting,
                    Others = @Others,
                    Total = @Total,
                    ModifiedDate = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (Date, ShiftId, ShiftChangeTime, Break_TeaTime, BlastingTime, Others, Total)
                VALUES (@Date, @ShiftId, @ShiftChange, @BreakTime, @Blasting, @Others, @Total);
        `;

        const totalMins = (shiftChange || 0) + (breakTime || 0) + (blasting || 0) + (others || 0);

        await pool.request()
            .input('Date', sql.Date, date)
            .input('ShiftId', sql.Int, shiftId)
            .input('ShiftChange', sql.Int, shiftChange || 0)
            .input('BreakTime', sql.Int, breakTime || 0)
            .input('Blasting', sql.Int, blasting || 0)
            .input('Others', sql.Int, others || 0)
            .input('Total', sql.Int, totalMins)
            .query(upsertQuery);


        // 2. Execute Stored Procedure
        const result = await pool.request()
            .input('Date', sql.Date, date)
            .input('ShiftId', sql.Int, shiftId)
            // Inputs for Time Breakdown (passed to SP for calculation if needed, though we just saved them)
            .input('ShiftChange', sql.Int, shiftChange || 0)
            .input('BreakTime', sql.Int, breakTime || 0)
            .input('Blasting', sql.Int, blasting || 0)
            .input('Others', sql.Int, others || 0)
            .execute('PMS2_New_Sp_ProductionTSMPLReport');

        // RS 0: Summary (Prod, Inputs, Calc Hrs)
        // RS 1: Crusher Details
        // RS 2: Header Info

        const summaryData = result.recordsets[0]?.[0] || {};
        const crusherDetails = result.recordsets[1] || [];
        const headerInfo = result.recordsets[2]?.[0] || {};

        return NextResponse.json({
            success: true,
            data: {
                summary: summaryData,
                crusher: crusherDetails,
                headerInfo: headerInfo
            }
        });

    } catch (error) {
        console.error("Report Generation Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
