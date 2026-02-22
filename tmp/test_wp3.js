const { getDbConnection, sql } = require('./lib/db');

async function test() {
    try {
        const pool = await getDbConnection();
        const request = pool.request();
        request.input('Date', sql.Date, '2025-08-31');
        const result = await request.query('EXEC PMS2_New_Sp_DailyProductionReport @Date');
        console.log("Result Set 11 (INPIT DUMPING):", result.recordsets[10]);
        console.log("Result Set 12 (WP-3):", result.recordsets[11]);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
