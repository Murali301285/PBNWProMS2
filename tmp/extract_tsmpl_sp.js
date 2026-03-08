const sql = require('mssql');
const fs = require('fs');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true }
};

async function run() {
    try {
        await sql.connect(config);
        const res = await sql.query(`
            SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.PMS2_New_Sp_ProductionTSMPLReport')) AS spDef
        `);
        const def = res.recordset[0].spDef;
        fs.writeFileSync('tmp/get_tsmpl_sp.sql', def);
        console.log("Extracted definition to tmp/get_tsmpl_sp.sql");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
