const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_1602',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkData() {
    try {
        await sql.connect(config);
        const date = '2026-02-01';
        const pmsCode = '2000799'; // Kom-214 from screenshot

        console.log(`Checking data for PMS Code: ${pmsCode} on ${date}`);

        // 1. Get Equipment ID
        const eqResult = await sql.query(`SELECT SlNo, EquipmentName FROM Master.TblEquipment WHERE PMSCode = '${pmsCode}'`);
        if (eqResult.recordset.length === 0) {
            console.log("Equipment not found");
            return;
        }
        const eqId = eqResult.recordset[0].SlNo;
        console.log(`Equipment ID: ${eqId} (${eqResult.recordset[0].EquipmentName})`);

        // 2. Check TblEquipmentReading
        console.log("\n--- TblEquipmentReading ---");
        const readingResult = await sql.query(`
            SELECT SlNo, ShiftId, OperatorId, TotalWorkingHr 
            FROM Trans.TblEquipmentReading 
            WHERE EquipmentId = ${eqId} AND CAST(Date AS DATE) = '${date}' AND IsDelete = 0
        `);
        console.table(readingResult.recordset);

        if (readingResult.recordset.length > 0) {
            const opIds = readingResult.recordset.map(r => r.OperatorId).filter(id => id);
            if (opIds.length > 0) {
                console.log(`\nChecking Operators: ${opIds.join(',')}`);
                const opResult = await sql.query(`SELECT SlNo, OperatorName FROM Master.TblOperator WHERE SlNo IN (${opIds.join(',')})`);
                console.table(opResult.recordset);
            } else {
                console.log("No OperatorId in Reading records.");
            }
        }

        // 3. Check TblLoading (as Hauler)
        console.log("\n--- TblLoading (As Hauler) ---");
        const loadingResult = await sql.query(`
            SELECT SlNo, ShiftId, NoofTrip, TotalQty 
            FROM Trans.TblLoading 
            WHERE HaulerEquipmentId = ${eqId} AND CAST(LoadingDate AS DATE) = '${date}' AND IsDelete = 0
        `);
        console.table(loadingResult.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkData();
