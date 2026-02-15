
const { getDbConnection } = require('../lib/db');

async function checkSchema() {
    try {
        const pool = await getDbConnection();

        console.log("--- TblActivity ---");
        const activity = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblActivity'
        `);
        console.table(activity.recordset);

        console.log("--- TblEquipment ---");
        const equipment = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblEquipment'
        `);
        console.table(equipment.recordset);

        console.log("--- TblShift ---");
        const shift = await pool.request().query(`
            SELECT * FROM [Master].[TblShift]
        `);
        console.table(shift.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkSchema();
