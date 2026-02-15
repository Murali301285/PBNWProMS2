
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

        console.log("--- TblEquipmentReading Sample ---");
        const reading = await sql.query("SELECT TOP 5 OperatorId, * FROM [Trans].[TblEquipmentReading] WHERE OperatorId IS NOT NULL");
        console.table(reading.recordset);

        if (reading.recordset.length > 0) {
            const opId = reading.recordset[0].OperatorId;
            console.log(`--- Checking Operator Master for ID: ${opId} ---`);

            const bySlNo = await sql.query(`SELECT * FROM [Master].[TblOperator] WHERE SlNo = ${opId}`);
            console.log("By SlNo:");
            console.table(bySlNo.recordset);

            // If SlNo doesn't match, check OperatorId column (though unlikely for an INT FK)
            // const byOpId = await sql.query(`SELECT * FROM [Master].[TblOperator] WHERE OperatorId = '${opId}'`);
            // console.log("By OperatorId String:");
            // console.table(byOpId.recordset);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkOperatorFK();
