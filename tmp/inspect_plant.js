
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

async function inspectPlant() {
    try {
        console.log(`Connecting to database: ${config.database} on ${config.server}`);
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- TblPlant Columns ---");
        const resPlant = await pool.request().query("SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblPlant' AND TABLE_SCHEMA = 'Master'");
        console.log(resPlant.recordset.map(r => r.COLUMN_NAME));

        console.log("--- TblPlant Data ---");
        const resPlantData = await pool.request().query("SELECT TOP 5 * FROM Master.TblPlant");
        console.log(resPlantData.recordset);

        await pool.close();

    } catch (error) {
        console.error('Error executing query:', error);
    }
}

inspectPlant();
