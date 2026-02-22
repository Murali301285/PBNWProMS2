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
        const request = new sql.Request();

        console.log("\n--- Rehandling distinct MaterialIds ---");
        const result = await request.query("SELECT DISTINCT MaterialId FROM Trans.TblMaterialRehandling WHERE IsDelete = 0");
        console.table(result.recordset);

        console.log("\n--- Material Names for IDs ---");
        const mats = await request.query("SELECT SlNo, MaterialName FROM Master.TblMaterial");
        console.table(mats.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

inspect();
