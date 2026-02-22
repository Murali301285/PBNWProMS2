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

async function checkLatestData() {
    try {
        await sql.connect(config);

        console.log("--- Latest Data in Trans.TblCrusher ---");
        const data = await sql.query(`
            SELECT TOP 5 Date, ProductionQty, PowerKWH, PlantId 
            FROM Trans.TblCrusher 
            ORDER BY Date DESC
        `);
        console.table(data.recordset);

        // Check date range of data
        console.log("\n--- Date Range of Crusher Data ---");
        const range = await sql.query(`
            SELECT MIN(Date) as FirstDate, MAX(Date) as LastDate 
            FROM Trans.TblCrusher
        `);
        console.table(range.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkLatestData();
