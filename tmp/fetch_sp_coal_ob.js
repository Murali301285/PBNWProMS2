const sql = require('mssql');
const fs = require('fs');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
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
            SELECT OBJECT_DEFINITION(OBJECT_ID('PMS2_New_Dash_SP_Performance_CoalOBProduction')) AS sp_code
        `);
        fs.writeFileSync('tmp/PMS2_New_Dash_SP_Performance_CoalOBProduction.sql', result.recordset[0].sp_code);
        console.log('Saved to tmp/PMS2_New_Dash_SP_Performance_CoalOBProduction.sql');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

fetchSP();
