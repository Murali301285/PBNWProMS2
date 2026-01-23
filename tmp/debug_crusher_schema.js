const { getDbConnection } = require('./lib/db');

async function checkSchema() {
    try {
        const pool = await getDbConnection();

        console.log("--- TblCrusher Columns ---");
        const res1 = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblCrusher' AND TABLE_SCHEMA = 'Trans'
        `);
        console.log(res1.recordset.map(r => r.COLUMN_NAME).join(', '));

        console.log("\n--- TblCrusherStoppage Columns ---");
        const res2 = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblCrusherStoppage' AND TABLE_SCHEMA = 'Trans'
        `);
        console.log(res2.recordset.map(r => r.COLUMN_NAME).join(', '));

    } catch (err) {
        console.error(err);
    }
}

checkSchema();
