const { getDbConnection } = require('../lib/db');

async function testV() {
    const pool = await getDbConnection();
    const res = await pool.request().query("SELECT DISTINCT [VehicleNo] FROM [Trans].[TblBDSEntry] WHERE IsDelete = 0 ORDER BY VehicleNo ASC");
    console.dir(res.recordset, { depth: null });
    process.exit(0);
}
testV();
