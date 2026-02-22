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

async function checkReading() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const eqId = 799;
        const date = '2026-02-01';

        // 1. Verify Equipment
        const eq = await sql.query(`SELECT SlNo, EquipmentName FROM Master.TblEquipment WHERE SlNo = ${eqId}`);
        if (eq.recordset.length === 0) {
            console.log("Equipment 799 not found!");
            return;
        }
        console.log(`Equipment: ${eq.recordset[0].EquipmentName} (ID: 799)`);

        // 2. Check Reading
        const reading = await sql.query(`
            SELECT SlNo, ShiftId, OperatorId, TotalWorkingHr, Date
            FROM Trans.TblEquipmentReading
            WHERE EquipmentId = ${eqId} 
             AND CAST(Date AS DATE) = '${date}'
             AND IsDelete = 0
        `);

        console.log("\nReading Records:");
        console.table(reading.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkReading();
