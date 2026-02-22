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

        const result = await sql.query(`
            EXEC PMS2_New_Sp_EquipmentPerformanceReport @Date = '2026-02-01'
        `);

        console.log("\nTop 5 Rows:");
        console.table(result.recordset.slice(0, 5));

        // Find ANY row with Trips > 0
        const trips = result.recordset.find(r => r['Shift ATotal Trips'] > 0 || r['Shift BTotal Trips'] > 0 || r['Shift CTotal Trips'] > 0);
        if (trips) {
            console.log("\nRow with Trips:");
            console.log(trips);
        } else {
            console.log("\nNo rows with trips found.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

verifySp();
