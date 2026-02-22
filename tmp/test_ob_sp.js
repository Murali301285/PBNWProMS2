const sql = require('mssql');

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

async function testQuery() {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query(`
            EXEC PMS2_New_Dash_SP_Performance_CoalOBProduction '2026-02-01', '2026-02-18'
        `);
        console.table(result.recordset);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

testQuery();
