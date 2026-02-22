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

        console.log("\n--- Trans.TblLoading Columns ---");
        let result = await request.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblLoading' AND TABLE_SCHEMA = 'Trans'");
        result.recordset.forEach(row => console.log(row.COLUMN_NAME));

        console.log("\n--- Master Tables (Source/Pit/Sector) ---");
        result = await request.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'Master' AND (TABLE_NAME LIKE '%Source%' OR TABLE_NAME LIKE '%Pit%' OR TABLE_NAME LIKE '%Sector%' OR TABLE_NAME LIKE '%Mine%')");
        result.recordset.forEach(row => console.log(row.TABLE_NAME));

        console.log("\n--- Trans Tables (Rehandling) ---");
        result = await request.query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME LIKE '%Rehandling%'");
        result.recordset.forEach(row => console.log(row.TABLE_NAME));

        console.log("\n--- Check TblLoading Content Sample ---");
        result = await request.query("SELECT TOP 1 * FROM Trans.TblLoading");
        console.log(result.recordset[0]);


    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

inspect();
