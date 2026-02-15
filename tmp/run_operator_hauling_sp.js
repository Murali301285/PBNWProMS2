
const fs = require('fs');
const path = require('path');
const mssql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function run() {
    try {
        await mssql.connect(config);
        const sqlPath = path.join(__dirname, 'create_sp_operator_hauling.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await mssql.query(sql);
        console.log("SP PMS2_New_Sp_OperatorPerformanceReport_Hauling created successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error creating SP:", error);
        process.exit(1);
    }
}

run();
