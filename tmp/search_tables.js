
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

async function searchTables() {
    try {
        console.log(`Connecting to database: ${config.database} on ${config.server}`);
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("Searching for 'Pump' in Trans schema...");
        const resTransPump = await pool.request().query("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME LIKE '%Pump%'");
        console.log(resTransPump.recordset);

        console.log("Searching for columns 'RunningHours' or 'RunHr'...");
        const resRunHr = await pool.request().query("SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME IN ('RunningHours', 'RunHr', 'WorkingHours') ORDER BY TABLE_NAME");
        console.log(resRunHr.recordset);

        console.log("Checking TblEquipmentReading columns...");
        const resEquip = await pool.request().query("SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblEquipmentReading' AND TABLE_SCHEMA = 'Trans'");
        console.log(resEquip.recordset);

        await pool.close();

    } catch (error) {
        console.error('Error executing query:', error);
    }
}

searchTables();
