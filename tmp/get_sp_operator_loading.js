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
        const query = "EXEC sp_helptext 'dbo.PMS2_New_Sp_OperatorPerformanceLoadingReport'";
        const result = await pool.request().query(query);
        const text = result.recordset.map(row => row.Text).join('');
        fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/current_sp_operator_loading.sql', text);
        console.log("SP text saved to tmp/current_sp_operator_loading.sql");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
execute();
