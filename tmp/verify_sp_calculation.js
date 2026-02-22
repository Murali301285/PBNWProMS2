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

async function verifySp() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("Executing SP for 2026-02-11...");
        const result = await sql.query(`
            EXEC PMS2_New_Sp_EquipmentPerformanceReport @Date = '2026-02-11'
        `);

        const row = result.recordset.find(r => r.Equipment === 'Kom-255');

        if (row) {
            console.log("\nRow for Kom-255:");
            console.log(`Equipment: ${row.Equipment}`);
            console.log(`Shift A Trips: ${row['Shift ATotal Trips']}`);
            console.log(`Shift A Hrs: ${row['Shift ATotal Hrs']}`);
            console.log(`Shift A Trips/Hr: ${row['Shift ATrips Per Hr']}`);
            console.log(`Shift A Qty/Hr: ${row['Shift AQty Per Hr']}`);
        } else {
            console.log("Kom-255 not found in result set.");
            // Dump top 5
            console.table(result.recordset.slice(0, 5));
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

verifySp();
