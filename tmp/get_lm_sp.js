const sql = require('mssql');
const fs = require('fs');
const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_0704',
    options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
    try {
        await sql.connect(config);
        const result = await sql.query(`EXEC sp_helptext 'PMS2_New_Sp_LoadingMasterReport'`);
        const text = result.recordset.map(r => r.Text).join('');
        fs.writeFileSync('tmp/lm_sp_fixed.sql', text, 'utf8');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
