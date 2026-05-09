const sql = require('mssql');
const fs = require('fs');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_2026',
    options: { encrypt: false, trustServerCertificate: true }
};

const sps = ['PMS2_New_Sp_HaulingMasterReport', 'PMS2_New_Sp_LoadingMasterReport', 'PMS2_New_Sp_MaterialRehandlingReport'];

async function run() {
    try {
        await sql.connect(config);
        for (let sp of sps) {
            const result = await sql.query(`EXEC sp_helptext '${sp}'`);
            if (result.recordsets.length > 0) {
               const text = result.recordset.map(r => r.Text).join('');
               fs.writeFileSync('tmp/' + sp + '.sql', text, 'utf8');
               console.log("Saved", sp);
            } else {
               console.log("Missing", sp);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
