
const { getDbConnection } = require('../lib/db');

async function getSpDefinition() {
    try {
        const pool = await getDbConnection();
        const result = await pool.request()
            .query("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.PMS2_New_Sp_LoadingMasterReport')) AS SpDefinition");

        console.log(result.recordset[0].SpDefinition);
    } catch (err) {
        console.error("Error fetching SP definition:", err);
    } finally {
        process.exit();
    }
}

getSpDefinition();
