
const { getDbConnection } = require('./lib/db');

async function testHelperAPI() {
    try {
        const pool = await getDbConnection();

        console.log("Fetching Activities...");
        const activities = await pool.request().query('SELECT SlNo as id, Name as name FROM [Master].[TblActivity] WHERE IsDelete = 0 AND IsActive = 1 ORDER BY Name');
        console.log(`Activities found: ${activities.recordset.length}`);
        if (activities.recordset.length > 0) console.table(activities.recordset.slice(0, 5));

        console.log("Fetching Equipment...");
        const equipment = await pool.request().query('SELECT SlNo as id, EquipmentName as name, ActivityId FROM [Master].[TblEquipment] WHERE IsDelete = 0 AND Active = 1 ORDER BY EquipmentName');
        console.log(`Equipment found: ${equipment.recordset.length}`);
        if (equipment.recordset.length > 0) console.table(equipment.recordset.slice(0, 5));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

testHelperAPI();
