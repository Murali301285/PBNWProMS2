
const { getDbConnection, sql } = require('./standalone_db');

async function main() {
    try {
        const pool = await getDbConnection();

        console.log('--- Checking Trans.TblLoadingShiftIncharge Schema ---');
        // Get one empty row to see keys
        const res = await pool.request().query(`SELECT TOP 0 * FROM Trans.TblLoadingShiftIncharge`);
        console.log('Columns:', Object.keys(res.recordset.columns));

        console.log('--- Checking Master.TblOperator Schema ---');
        const resOp = await pool.request().query(`SELECT TOP 1 * FROM Master.TblOperator`);
        console.log('Operator Columns:', Object.keys(resOp.recordset.columns));
        console.log('First Operator:', resOp.recordset[0]);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

main();
