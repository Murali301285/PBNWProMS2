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

async function testFilters() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");
        const request = new sql.Request();

        const modelsRes = await request.query("SELECT DISTINCT Model FROM Master.TblEquipment WHERE IsDelete = 0 AND Model IS NOT NULL ORDER BY Model");
        console.log("Models:", modelsRes.recordset.length);

        const capacitiesRes = await request.query("SELECT DISTINCT Capacity FROM Master.TblEquipment WHERE IsDelete = 0 AND Capacity IS NOT NULL ORDER BY Capacity");
        console.log("Capacities:", capacitiesRes.recordset.length);

        const shiftsRes = await request.query("SELECT SlNo, ShiftName FROM Master.TblShift WHERE IsDelete = 0 ORDER BY SlNo");
        console.log("Shifts:", shiftsRes.recordset.length);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

testFilters();
