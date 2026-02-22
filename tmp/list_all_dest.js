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

async function listDestinations() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Master.TblDestination ---");
        const d1 = await sql.query("SELECT * FROM Master.TblDestination");
        console.table(d1.recordset);

        console.log("\n--- Master.tblFillingPoint ---");
        const d2 = await sql.query("SELECT * FROM Master.tblFillingPoint");
        console.table(d2.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

listDestinations();
