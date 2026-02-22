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

async function checkWP3Coal() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Checking Coal with SourceId = 5 (WP-3) ---");
        const wp3Data = await sql.query(`
            SELECT TOP 20 
                L.LoadingDate,
                L.ShiftId,
                L.SourceId, 
                S.SectorName, 
                L.DestinationId, 
                D.Name as DestName,
                L.TotalQty 
            FROM Trans.TblLoading L
            LEFT JOIN Master.TblSector S ON L.SourceId = S.SlNo
            LEFT JOIN Master.TblDestination D ON L.DestinationId = D.SlNo
            WHERE L.MaterialId = 7 AND L.SourceId = 5
            ORDER BY L.LoadingDate DESC
        `);
        console.table(wp3Data.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkWP3Coal();
