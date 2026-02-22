const sql = require('mssql');
const fs = require('fs');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_1602',
    options: { encrypt: false, trustServerCertificate: true }
};

let q = fs.readFileSync('tmp/sp_dash_op.sql', 'utf8').replace(/\r\n/g, '\n');
q = q.replace(/CREATE\s+PROCEDURE/i, 'ALTER PROCEDURE');

// Replace SELECT clause
q = q.replace(/O\.OperatorName,/g, "CONCAT(O.OperatorName, ' (', ER.OperatorId, ')') AS OperatorName,\n            FORMAT(L.LoadingDate, 'dd-MMM-yyyy') AS Date,");

// Replace GROUP BY
q = q.replace(/GROUP BY O\.OperatorName/g, "GROUP BY O.OperatorName, ER.OperatorId, L.LoadingDate");

fs.writeFileSync('tmp/update_dash_op.sql', q);

async function run() {
    try {
        await sql.connect(config);
        await sql.query(q);
        console.log('Operator Performance SP Updated successfully.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
