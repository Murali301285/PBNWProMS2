
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

async function checkSP() {
    try {
        console.log(`Connecting to database: ${config.database} on ${config.server}`);
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- Checking ProMS2_SPReportSectorWiseProduction Arguments ---");
        const resArgs = await pool.request().query("SELECT PARAMETER_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.PARAMETERS WHERE SPECIFIC_NAME = 'ProMS2_SPReportSectorWiseProduction'");
        console.log(resArgs.recordset);

        await pool.close();

    } catch (error) {
        console.error('Error executing query:', error);
    }
}

checkSP();
