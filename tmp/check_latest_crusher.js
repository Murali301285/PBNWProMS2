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

        console.log("--- Latest Dates in Trans.TblCrusher ---");
        const data = await sql.query(`
            SELECT TOP 5 Date, Quantity, Kwh 
            FROM Trans.TblCrusher 
            ORDER BY Date DESC
        `);
        console.table(data.recordset);

        // Check if there is data for 'WP-3' (ID 5) which is also marked for DPR
        console.log("\n--- Checking Data for WP-3 (ID 5) ---");
        const wp3 = await sql.query(`
            SELECT COUNT(*) as Count, MAX(Date) as LastDate 
            FROM Trans.TblCrusher 
            WHERE PlantId = 5
        `);
        console.table(wp3.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkLatestData();
