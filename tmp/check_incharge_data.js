
const { getDbConnection, sql } = require('./standalone_db');

async function main() {
    try {
        const pool = await getDbConnection();

        console.log('--- Checking Loading Records for 2026-02-15 ---');
        const loadingRes = await pool.request().query(`
            SELECT TOP 5 SlNo, LoadingDate, ShiftId 
            FROM Trans.TblLoading 
            WHERE Convert(date, LoadingDate) = '2026-02-15'
        `);
        console.log('Loading Records:', loadingRes.recordset);

        if (loadingRes.recordset.length > 0) {
            const loadingId = loadingRes.recordset[0].SlNo;
            console.log(`--- Checking Incharge for LoadingId ${loadingId} ---`);
            const inchargeRes = await pool.request().query(`
                SELECT * FROM Trans.TblLoadingShiftIncharge WHERE LoadingId = ${loadingId}
            `);
            console.log('Incharge Records:', inchargeRes.recordset);
        }

        console.log('--- Checking Master.TblOperator ---');
        const operatorRes = await pool.request().query(`
            SELECT TOP 5 SlNo, OperatorName, OperatorCode FROM Master.TblOperator
        `);
        console.log('Operators:', operatorRes.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

main();
