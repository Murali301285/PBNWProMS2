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

async function checkSectors() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Searching Master.TblSector ---");
        const sections = await sql.query("SELECT * FROM Master.TblSector WHERE SectorName LIKE '%WP%' OR SectorName LIKE '%3%'");
        console.table(sections.recordset);

        // Also check the SectorId of the Coal transactions at Stock Yard (Dest 8)
        console.log("\n--- Sector of Coal at Stock Yard (Dest 8) ---");
        const coalSector = await sql.query(`
            SELECT TOP 20 
                L.SectorId, S.SectorName, L.DestinationId, L.MaterialId, L.TotalQty 
            FROM Trans.TblLoading L
            LEFT JOIN Master.TblSector S ON L.SectorId = S.SlNo
            WHERE L.MaterialId = 7 AND L.DestinationId = 8
            ORDER BY L.LoadingDate DESC
        `);
        console.table(coalSector.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkSectors();
