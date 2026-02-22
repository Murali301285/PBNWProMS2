
const mssql = require('mssql');

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

async function verifyOperator() {
    try {
        await mssql.connect(config);

        // Check TblOperator
        try {
            const ops = await mssql.query`SELECT TOP 5 SlNo, OperatorName FROM Master.TblOperator WHERE SlNo > 2000`;
            console.log("TblOperator Sample:", ops.recordset);

            if (ops.recordset.length > 0) {
                console.log("CONFIRMED: ShiftInchargeId likely refers to Master.TblOperator");
            } else {
                console.log("TblOperator IDs > 2000 not found.");
            }

        } catch (e) { console.log("TblOperator error:", e.message); }

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

verifyOperator();
