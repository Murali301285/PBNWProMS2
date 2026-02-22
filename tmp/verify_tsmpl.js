const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_1602',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function verifyTSMPL() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const targetDate = '2026-02-10'; // Known data date
        const shiftId = 1; // Assuming Shift 1, or try NULL if SP allows (but frontend passes ID)

        // Find a shift with data on that date
        const shiftCheck = await sql.query(`SELECT DISTINCT ShiftId FROM Trans.TblMaterialRehandling WHERE CAST(RehandlingDate AS DATE) = '${targetDate}'`);
        const validShift = shiftCheck.recordset[0]?.ShiftId || 1;
        console.log(`Testing for Date: ${targetDate}, Shift: ${validShift}`);

        const request = new sql.Request();
        request.input('Date', sql.Date, targetDate);
        request.input('ShiftId', sql.Int, validShift);
        request.input('ShiftChange', sql.Int, 0);
        request.input('BreakTime', sql.Int, 0);
        request.input('Blasting', sql.Int, 0);
        request.input('Others', sql.Int, 0);

        const result = await request.execute('PMS2_New_Sp_ProductionTSMPLReport');

        const summary = result.recordsets[0][0];
        console.log("\n--- Report Summary ---");
        console.table({
            ProdCoal: summary.ProdCoal,
            ProdOB: summary.ProdOB,
            WPCoalQty: summary.WPCoalQty,
            WPObQty: summary.WPObQty,
            CarpettingObQty: summary.CarpettingObQty,
            RehandlingCoalQty: summary.RehandlingCoalQty
        });

        // Also verify raw table data for that date/shift
        console.log("\n--- Raw Rehandling Data ---");
        const raw = await sql.query(`
            SELECT MaterialId, SUM(NoofTrip * QtyTrip) as Qty 
            FROM Trans.TblMaterialRehandling 
            WHERE CAST(RehandlingDate AS DATE) = '${targetDate}' AND ShiftId = ${validShift}
            GROUP BY MaterialId
        `);
        console.table(raw.recordset);


    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

verifyTSMPL();
