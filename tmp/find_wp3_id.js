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

async function findWP3() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Searching Master.TblDestination ---");
        const d1 = await sql.query("SELECT * FROM Master.TblDestination WHERE Name LIKE '%WP%' OR Name LIKE '%3%'");
        console.table(d1.recordset);

        console.log("\n--- Searching Master.tblFillingPoint ---");
        const d2 = await sql.query("SELECT * FROM Master.tblFillingPoint WHERE FillingPoint LIKE '%WP%' OR FillingPoint LIKE '%3%'");
        console.table(d2.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

findWP3();
