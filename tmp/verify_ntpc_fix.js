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

async function verifyFix() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        // Test for 2026-02-11 where we know Coal went to Stock Yard (ID 8)
        // ShiftId 3 (from previous data check) or 1? I'll try ShiftId 1, 2, 3 or just pass NULL if SP allows (SP definition says @ShiftId INT = NULL)
        // Previous data query showed ShiftId 1 (Stock Yard) and ShiftId 3 (Dump B OB).
        // Let's test with NULL ShiftId to get daily total.

        const request = new sql.Request();
        request.input('Date', sql.Date, '2026-02-11');
        request.input('ShiftId', sql.Int, 1); // Shift 1 has data

        const result = await request.execute('PMS2_New_Sp_ProductionNTPCReport');

        const summary = result.recordsets[0][0];
        console.log("\n--- Verification Result for 2026-02-11 ---");
        console.table(summary);

        if (summary.WPCoalQty > 0) {
            console.log("SUCCESS: WPCoalQty is populated.");
        } else {
            console.log("FAILURE: WPCoalQty is still 0.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

verifyFix();
