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

        console.log("\n--- Master.TblEquipment Columns ---");
        let result = await request.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblEquipment' AND TABLE_SCHEMA = 'Master'");
        result.recordset.forEach(row => console.log(row.COLUMN_NAME));

        console.log("\n--- Master.TblEquipmentModel Columns ---");
        result = await request.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblEquipmentModel' AND TABLE_SCHEMA = 'Master'");
        result.recordset.forEach(row => console.log(row.COLUMN_NAME));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

inspect();
