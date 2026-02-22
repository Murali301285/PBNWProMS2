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

async function debugWP3() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Check Destination Master ---");
        const dest = await sql.query("SELECT SlNo, FillingPoint FROM Master.tblFillingPoint WHERE SlNo = 2"); // Note: FillingPoint table is used for Destination in Loading
        // Wait, SP uses `TblDestination` in JOIN? No, SP uses `T0.DestinationId`. 
        // Let's check `Master.TblDestination` AND `Master.tblFillingPoint` (which is often used for Destination).
        // The SP variable is `@DestinationDumpB`.

        console.log("Master.TblDestination for ID 2:");
        try {
            const d1 = await sql.query("SELECT * FROM Master.TblDestination WHERE SlNo = 2");
            console.table(d1.recordset);
        } catch (e) { console.log("Master.TblDestination error or empty"); }

        console.log("Master.tblFillingPoint for ID 2:");
        try {
            const d2 = await sql.query("SELECT * FROM Master.tblFillingPoint WHERE SlNo = 2");
            console.table(d2.recordset);
        } catch (e) { console.log("Master.tblFillingPoint error or empty"); }

        console.log("\n--- Check Loading Data for Date '2026-02-19' (assuming today) ---");
        // User didn't specify date, I'll check for recent dates with Coal + Destination 2
        const data = await sql.query(`
            SELECT TOP 10 
                L.LoadingDate, L.ShiftId, L.MaterialId, L.DestinationId, 
                L.NoofTrip, L.NtpcQtyTrip, L.TotalQty
            FROM Trans.TblLoading L
            WHERE L.MaterialId = 7 -- Coal
            AND L.DestinationId = 2 -- WP-3?
            ORDER BY L.LoadingDate DESC
        `);
        console.table(data.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

debugWP3();
