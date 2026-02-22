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
        enableArithAbort: true
    }
};

async function run() {
    try {
        const pool = await sql.connect(config);

        console.log("Looking for Crusher tables...");
        const res = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%Crush%'");
        console.table(res.recordset);

        console.log("\nChecking TblCrusher CHMR - OHMR calculation...");
        const res2 = await pool.request().query("SELECT TOP 5 Date, CHMR, OHMR, (CHMR - OHMR) AS CalcHrs, BeltScaleCHMR, BeltScaleOHMR, RunningHr FROM Trans.TblCrusher ORDER BY SlNo DESC");
        console.table(res2.recordset);

        console.log("\nChecking TblCrusherDelay...");
        const res3 = await pool.request().query("SELECT TOP 5 * FROM Trans.TblCrusherDelay ORDER BY SlNo DESC");
        console.table(res3.recordset);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
