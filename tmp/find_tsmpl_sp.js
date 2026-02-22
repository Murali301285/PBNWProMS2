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

        console.log("Looking for TSMPL procedures...");
        const res = await pool.request().query("SELECT name FROM sys.procedures WHERE name LIKE '%TSMPL%'");
        console.table(res.recordset);

        if (res.recordset.length > 0) {
            const spName = res.recordset[0].name;
            console.log("Fetching definition for", spName);
            const defRes = await pool.request().query(`EXEC sp_helptext '${spName}'`);
            const text = defRes.recordset.map(r => r.Text).join('');
            fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/sp_tsmpl.sql', text);
            console.log("Saved to tmp/sp_tsmpl.sql");
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
