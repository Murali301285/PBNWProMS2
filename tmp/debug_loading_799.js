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

async function checkLoading() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const eqId = 799;
        const date = '2026-02-01';

        // Check Loading (as Machine or Hauler)
        const loading = await sql.query(`
            SELECT SlNo, LoadingMachineEquipmentId, HaulerEquipmentId, ShiftId, NoofTrip, TotalQty, OperatorId
            FROM Trans.TblLoading
            WHERE (LoadingMachineEquipmentId = ${eqId} OR HaulerEquipmentId = ${eqId})
             AND CAST(LoadingDate AS DATE) = '${date}'
             AND IsDelete = 0
        `);

        console.log("\nLoading Records:");
        console.table(loading.recordset);

        // Also check Schema of TblLoading to see if OperatorId exists
        const schema = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblLoading' AND COLUMN_NAME = 'OperatorId'
        `);
        if (schema.recordset.length > 0) {
            console.log("OperatorId column exists in Trans.TblLoading");
        } else {
            console.log("OperatorId column DOES NOT exist in Trans.TblLoading");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkLoading();
