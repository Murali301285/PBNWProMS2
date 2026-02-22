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

async function checkRehandling() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const targetDate = '2026-02-10'; // Using the date with known data

        console.log(`\n--- Rehandling Breakdown for ${targetDate} ---`);
        const data = await sql.query(`
            SELECT 
                MaterialId, 
                SUM(NoofTrip) as Trips, 
                SUM(TotalQty) as Qty 
            FROM Trans.TblMaterialRehandling 
            WHERE CAST(RehandlingDate AS DATE) = '${targetDate}'
            GROUP BY MaterialId
        `);
        console.table(data.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkRehandling();
