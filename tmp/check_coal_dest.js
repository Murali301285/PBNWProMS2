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

async function checkCoalDest() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        // Use today's date or recent date if no data today
        const queryDate = '2026-02-19';

        console.log(`\n--- Coal Destinations for ${queryDate} ---`);
        const data = await sql.query(`
            SELECT 
                L.DestinationId, 
                D.FillingPoint as DestName, -- trying FillingPoint table as Dest name source
                D2.Name as DestName2, -- trying Destination table
                COUNT(*) as Count,
                SUM(L.TotalQty) as TotalQty
            FROM Trans.TblLoading L
            LEFT JOIN Master.tblFillingPoint D ON L.DestinationId = D.SlNo
            LEFT JOIN Master.TblDestination D2 ON L.DestinationId = D2.SlNo
            WHERE L.MaterialId = 7 -- Coal
            AND CAST(L.LoadingDate AS DATE) = '${queryDate}'
            GROUP BY L.DestinationId, D.FillingPoint, D2.Name
        `);
        console.table(data.recordset);

        // Also check if there is any data for Destination 2 (Dump B) for ANY material
        console.log("\n--- Data for Destination 2 (Dump B) ---");
        const dumpB = await sql.query(`
            SELECT MaterialId, COUNT(*) as Count, SUM(TotalQty) as Qty
            FROM Trans.TblLoading
            WHERE DestinationId = 2
            AND CAST(LoadingDate AS DATE) = '${queryDate}'
            GROUP BY MaterialId
        `);
        console.table(dumpB.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkCoalDest();
