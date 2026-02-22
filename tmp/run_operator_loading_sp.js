
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

async function execute() {
    try {
        const pool = await sql.connect(config);
        const query = fs.readFileSync('f:/Dev/ProMS/ProMSDev/tmp/update_sp_operator_loading.sql', 'utf8');
        await pool.request().batch(query);
        console.log("SP PMS2_New_Sp_OperatorPerformanceLoadingReport Updated Successfully!");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
execute();
