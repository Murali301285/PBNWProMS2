const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_2203',
    options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
    try {
        await sql.connect(config);

        // 1. Check Top 5 rows from TblWaterTankerEntry to see what DestinationId holds
        console.log("--- TOP 5 WaterTankerEntry ROWS where DestinationId IS NOT NULL ---");
        const res1 = await sql.query(`
            SELECT TOP 5 SlNo, DestinationId, FillingPointId 
            FROM [Transaction].[TblWaterTankerEntry] 
            ORDER BY EntryDate DESC
        `);
        console.log(res1.recordset);

        // 2. Check SP text again to ensure it updated
        console.log("\n--- CURRENT SP TEXT ---");
        const res2 = await sql.query(`EXEC sp_helptext 'ProMS2_SPReportWaterTankerEntry'`);
        const text = res2.recordset.map(r => r.Text).join('');
        console.log(text);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
