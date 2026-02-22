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

        console.log("\n--- Shifts ---");
        let result = await request.query("SELECT SlNo, ShiftName FROM Master.TblShift WHERE IsDelete = 0");
        console.table(result.recordset);

        console.log("\n--- Models ---");
        result = await request.query("SELECT DISTINCT Model FROM Master.TblEquipment WHERE IsDelete = 0 AND Model IS NOT NULL ORDER BY Model");
        console.table(result.recordset);

        console.log("\n--- Capacities ---");
        result = await request.query("SELECT DISTINCT Capacity FROM Master.TblEquipment WHERE IsDelete = 0 AND Capacity IS NOT NULL ORDER BY Capacity");
        console.table(result.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

inspect();
