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
        enableArithAbort: true
    }
};

async function run() {
    try {
        const pool = await sql.connect(config);
        const res = await pool.request().query("EXEC sp_helptext 'PMS2_New_Sp_ProductionNTPCReport'");
        const text = res.recordset.map(r => r.Text).join('');
        fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_ntpc_current.sql', text);
        console.log('Saved to f:/Dev/ProMS/ProMSDev/tmp/sp_ntpc_current.sql');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

run();
