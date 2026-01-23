
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

async function checkSchema() {
    try {
        console.log("Connecting...");
        const pool = await new sql.ConnectionPool(config).connect();
        console.log("Connected.");

        console.log("--- Checking TblEquipmentReading Columns ---");
        const res1 = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblEquipmentReading'
        `);
        console.table(res1.recordset);

        console.log("\n--- Checking Child Tables Existence ---");
        const res2 = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME LIKE 'TblEquipmentReading%'
        `);
        console.table(res2.recordset);

        console.log("\n--- Checking Data in TblEquipmentReading (Top 1) ---");
        const res3 = await pool.request().query(`
            SELECT TOP 1 * FROM [Trans].[TblEquipmentReading] ORDER BY SlNo DESC
        `);
        console.log(res3.recordset[0]);

        console.log("\n--- Checking Data in Child Tables (Top 5) ---");
        try {
            const res4 = await pool.request().query(`
                SELECT TOP 5 * FROM [Trans].[TblEquipmentReadingShiftIncharge]
            `);
            console.log("Incharge Child Data:", res4.recordset);
        } catch (e) { console.log("Incharge Child Table Error:", e.message); }

        try {
            const res5 = await pool.request().query(`
                SELECT TOP 5 * FROM [Trans].[TblEquipmentReadingOperator]
            `);
            console.log("Operator Child Data:", res5.recordset);
        } catch (e) { console.log("Operator Child Table Error:", e.message); }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkSchema();
