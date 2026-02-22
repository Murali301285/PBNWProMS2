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
        const defRes = await pool.request().query("EXEC sp_helptext 'PMS2_New_Sp_DailyProgressReport'");
        const text = defRes.recordset.map(r => r.Text).join('');
        fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_daily_progress.sql', text);
        console.log("Saved to tmp/sp_daily_progress.sql");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
