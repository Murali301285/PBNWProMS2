const sql = require('mssql');
const fs = require('fs');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_2026',
    options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
    try {
        await sql.connect(config);
        const result = await sql.query(`EXEC sp_helptext 'ProMS2_SPReportWaterTankerEntry'`);
        if (result.recordsets.length > 0 && result.recordset.length > 0) {
            const text = result.recordset.map(r => r.Text).join('');
            fs.writeFileSync('tmp/get_wt_sp.sql', text, 'utf8');
            console.log("Dumped WT SP successfully");
        } else {
            console.log("No result");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
