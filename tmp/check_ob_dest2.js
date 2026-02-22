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

async function checkOBDest2() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        // I need to find a date where there is data, or use a wide range.
        // I'll check the last 50 transactions for Destination 2 (Dump B)
        console.log("\n--- Recent Loading for Destination 2 (Dump B) ---");
        const data = await sql.query(`
            SELECT TOP 50
                L.LoadingDate,
                L.ShiftId,
                L.MaterialId,
                -- M.Name as MaterialName, -- Removed to avoid error, ID is enough
                L.NoofTrip,
                L.NtpcQtyTrip,
                L.TotalQty
            FROM Trans.TblLoading L
            -- LEFT JOIN Master.TblMaterial M ON L.MaterialId = M.SlNo
            WHERE L.DestinationId = 2
            ORDER BY L.LoadingDate DESC
        `);
        console.table(data.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkOBDest2();
