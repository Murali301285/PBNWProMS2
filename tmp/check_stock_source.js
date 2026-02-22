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

async function checkStockYardSource() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Search 'Stock' in Sector/FillingPoint ---");
        const sectors = await sql.query("SELECT * FROM Master.TblSector WHERE Name LIKE '%Stock%'");
        console.table(sectors.recordset);

        const fillPoints = await sql.query("SELECT * FROM Master.tblFillingPoint WHERE FillingPoint LIKE '%Stock%'");
        console.table(fillPoints.recordset);

        // Assuming SourceId in Loading links to FillingPoint (or Sector? Usually FillingPoint/Source).
        // Let's check recent Loading Data distinct SourceId

        console.log("\n--- Recent Loading SourceIds ---");
        const sources = await sql.query(`
            SELECT DISTINCT SourceId 
            FROM Trans.TblLoading 
            WHERE LoadingDate > DATEADD(day, -30, GETDATE())
        `);
        // If SourceId matches one of the Stock Yard IDs found above, we have a winner.
        console.log("Active Source IDs:", sources.recordset.map(r => r.SourceId));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkStockYardSource();
