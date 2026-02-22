
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

async function checkIds() {
    try {
        await mssql.connect(config);

        // Check TblOperator
        try {
            const ops = await mssql.query`SELECT TOP 5 SlNo, Name, OperatorName FROM Master.TblOperator WHERE SlNo > 2000`;
            console.log("TblOperator Sample:", ops.recordset);
        } catch (e) { console.log("TblOperator error or empty:", e.message); }

        // Check TblUser
        try {
            const users = await mssql.query`SELECT TOP 5 SlNo, UserName FROM Master.TblUser WHERE SlNo > 2000`;
            console.log("TblUser Sample:", users.recordset);
        } catch (e) { console.log("TblUser error or empty:", e.message); }

        // Check TblManpower
        try {
            const man = await mssql.query`SELECT TOP 5 SlNo, Name FROM Master.TblManpower WHERE SlNo > 2000`;
            console.log("TblManpower Sample:", man.recordset);
        } catch (e) { console.log("TblManpower error or empty:", e.message); }

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkIds();
