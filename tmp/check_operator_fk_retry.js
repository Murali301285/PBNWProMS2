
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function checkOperatorFK() {
    try {
        await sql.connect(config);

        console.log("--- Fetching one OperatorId ---");
        // Select ONLY OperatorId to avoid duplicates
        const reading = await sql.query("SELECT TOP 1 OperatorId FROM [Trans].[TblEquipmentReading] WHERE OperatorId IS NOT NULL AND OperatorId > 0");

        if (reading.recordset.length > 0) {
            const opId = reading.recordset[0].OperatorId;
            console.log(`Type of OperatorId: ${typeof opId}`);
            console.log(`Value of OperatorId: ${opId}`);

            if (typeof opId === 'object') {
                console.log("OperatorId is an object/array: ", JSON.stringify(opId));
                // This confirms duplicate column issue or similar
                return;
            }

            console.log(`--- Checking Operator Master for ID: ${opId} ---`);

            // Check against SlNo
            const bySlNo = await sql.query(`SELECT SlNo, OperatorName, OperatorId FROM [Master].[TblOperator] WHERE SlNo = ${opId}`);
            console.log("By SlNo:");
            if (bySlNo.recordset.length > 0) {
                console.table(bySlNo.recordset);
            } else {
                console.log("No match found by SlNo.");
            }

            // Check against OperatorId (if it's an integer usage)
            // Note: TblOperator.OperatorId might be string or int. 
            // Previous schema check didn't show types for TblOperator, only names. 
            // If SlNo match works and Name looks real, we are good.
        } else {
            console.log("No reading records with OperatorId found.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkOperatorFK();
