const sql = require('mssql');
const fs = require('fs');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_1602',
    options: { encrypt: false, trustServerCertificate: true }
};

let q = fs.readFileSync('tmp/update_dash_op.sql', 'utf8').replace(/\r\n/g, '\n');

// The script currently has: CONCAT(O.OperatorName, ' (', ER.OperatorId, ')') AS OperatorName
// I will replace it with: CONCAT(O.OperatorName, ' (', O.OperatorId, ')') AS OperatorName
q = q.replace(/CONCAT\(O\.OperatorName, ' \(', ER\.OperatorId, '\)'\)/g, "CONCAT(O.OperatorName, ' (', O.OperatorId, ')')");

fs.writeFileSync('tmp/update_dash_op_v2.sql', q);

async function run() {
    try {
        await sql.connect(config);
        await sql.query(q);
        console.log('Operator Performance SP Updated successfully with O.OperatorId');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
