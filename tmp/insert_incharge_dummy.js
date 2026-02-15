
const { getDbConnection, sql } = require('./standalone_db');

async function main() {
    try {
        const pool = await getDbConnection();

        console.log('--- Fetching Loading IDs for 2026-02-15 ---');
        const loadingRes = await pool.request().query(`
            SELECT SlNo, ShiftId 
            FROM Trans.TblLoading 
            WHERE Convert(date, LoadingDate) = '2026-02-15'
        `);

        const loadings = loadingRes.recordset;
        console.log(`Found ${loadings.length} loading records.`);

        if (loadings.length === 0) {
            console.log('No loading records found. Aborting.');
            return;
        }

        console.log('--- Fetching Master Operator ---');
        const opRes = await pool.request().query(`SELECT TOP 1 SlNo FROM Master.TblOperator`);
        const operatorId = opRes.recordset[0]?.SlNo;

        if (!operatorId) {
            console.log('No operator found. Aborting.');
            return;
        }
        console.log(`Using Operator ID: ${operatorId}`);

        console.log('--- Inserting/Updating Incharge Data ---');
        for (const loading of loadings) {
            // Check if exists
            const check = await pool.request().query(`SELECT SlNo FROM Trans.TblLoadingShiftIncharge WHERE LoadingId = ${loading.SlNo}`);

            if (check.recordset.length === 0) {
                await pool.request().query(`
                    INSERT INTO Trans.TblLoadingShiftIncharge (LoadingId, OperatorId, UpdatedBy)
                    VALUES (${loading.SlNo}, ${operatorId}, 1)
                `);
                console.log(`Inserted Incharge for LoadingId: ${loading.SlNo}`);
            } else {
                console.log(`Incharge already exists for LoadingId: ${loading.SlNo}`);
            }
        }

        console.log('--- Done ---');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

main();
