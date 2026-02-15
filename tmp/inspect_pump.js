
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_Serv',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
};

async function inspectPump() {
    try {
        console.log(`Connecting to database: ${config.database} on ${config.server}`);
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- Master.tblFillingPump Data ---");
        const resPump = await pool.request().query("SELECT TOP 5 * FROM Master.tblFillingPump");
        console.log(resPump.recordset);

        console.log("--- TblEquipment Columns (Group/Activity) ---");
        const resEquip = await pool.request().query("SELECT TOP 10 EquipmentGroupId, ActivityId, EquipmentName FROM Master.TblEquipment");
        console.log("Sample Equipment:");
        console.log(resEquip.recordset);

        console.log("Checking Activities");
        const resActivity = await pool.request().query("SELECT * FROM Master.TblActivity"); // Assume TblActivity exists
        console.log(resActivity.recordset);

        await pool.close();

    } catch (error) {
        console.error('Error executing query:', error);
    }
}

inspectPump();
