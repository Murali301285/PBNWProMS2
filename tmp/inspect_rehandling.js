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

        console.log("\n--- Trans.TblMaterialRehandling Columns ---");
        let result = await request.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblMaterialRehandling' AND TABLE_SCHEMA = 'Trans'");
        result.recordset.forEach(row => console.log(row.COLUMN_NAME));

        console.log("\n--- Accessing Master.TblSource ---");
        result = await request.query("SELECT * FROM Master.TblSource WHERE IsDelete = 0");
        console.table(result.recordset);

        console.log("\n--- Accessing Master.TblSector ---");
        result = await request.query("SELECT * FROM Master.TblSector WHERE IsDelete = 0");
        console.table(result.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

inspect();
