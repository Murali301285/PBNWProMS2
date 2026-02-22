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

async function inspect() {
    try {
        await sql.connect(config);
        const request = new sql.Request();

        console.log("\n--- TblEquipmentReading Sample ---");
        let result = await request.query("SELECT TOP 3 SlNo, EquipmentId, OperatorId FROM Trans.TblEquipmentReading WHERE OperatorId IS NOT NULL");
        console.table(result.recordset);
        const sampleOpId = result.recordset[0]?.OperatorId;

        if (sampleOpId) {
            console.log(`\n--- Searching Master.TblOperator for match with ${sampleOpId} ---`);
            // Check if it matches SlNo
            let matchSlNo = await request.query(`SELECT SlNo, OperatorId, OperatorName FROM Master.TblOperator WHERE SlNo = ${sampleOpId}`);
            console.log("Match on SlNo:", matchSlNo.recordset);

            // Check if it matches OperatorId (string) - only if sample is not numeric or if numeric match failed/ambiguous
            // Assuming it's likely SlNo (int) based on typical ProMS references which use SlNo for IDs.
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

inspect();
