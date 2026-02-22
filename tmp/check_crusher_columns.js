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
        const res = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblCrusher' AND TABLE_SCHEMA = 'Trans'");
        console.table(res.recordset);

        console.log("Checking top 5 records of TblCrusher...");
        const res2 = await pool.request().query("SELECT TOP 5 Date, ShiftId, PlantId, RunningHr, TotalWorkingHour FROM Trans.TblCrusher");
        console.table(res2.recordset);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
