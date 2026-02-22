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

async function checkCoalSource() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        // Check if SourceId links to TblSector
        console.log("\n--- Checking Source of Coal at Stock Yard (Dest 8) ---");
        const coalData = await sql.query(`
            SELECT TOP 20 
                L.SourceId, 
                S.SectorName, 
                L.DestinationId, 
                D.Name as DestName,
                L.MaterialId, 
                L.TotalQty 
            FROM Trans.TblLoading L
            LEFT JOIN Master.TblSector S ON L.SourceId = S.SlNo
            LEFT JOIN Master.TblDestination D ON L.DestinationId = D.SlNo
            WHERE L.MaterialId = 7 AND L.DestinationId = 8
            ORDER BY L.LoadingDate DESC
        `);
        console.table(coalData.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkCoalSource();
