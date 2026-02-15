
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

async function getSPDef() {
    try {
        console.log(`Connecting to database: ${config.database} on ${config.server}`);
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- ProMS2_SPReportSectorWiseProduction Definition ---");
        const resDef = await pool.request().query("sp_helptext 'ProMS2_SPReportSectorWiseProduction'");
        resDef.recordset.forEach(r => process.stdout.write(r.Text));

        await pool.close();

    } catch (error) {
        console.error('Error executing query:', error);
    }
}

getSPDef();
