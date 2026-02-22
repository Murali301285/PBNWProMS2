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

async function inspect() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const request = new sql.Request();

        console.log("\n--- Find Dates with Data ---");
        const result = await request.query("SELECT TOP 5 Date, PlantId, TotalQty FROM Trans.TblCrusher WHERE IsDelete = 0 ORDER BY Date DESC");
        console.table(result.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

inspect();
