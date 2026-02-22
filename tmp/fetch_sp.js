const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    database: process.env.DB_DATABASE || 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function fetchSP() {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT OBJECT_DEFINITION(OBJECT_ID('PMS2_New_Dash_SP_PerformanceDashboard')) AS sp_code
        `);
        console.log("---START_SP---");
        console.log(result.recordset[0].sp_code);
        console.log("---END_SP---");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

fetchSP();
