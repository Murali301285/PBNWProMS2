
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

        const sqlPath = path.join(__dirname, 'create_sp_operator_loading_report.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by 'GO' if necessary, but for single create proc it's usually fine as one block 
        // if we use mssql.query batch. 
        // However, 'GO' is not T-SQL, it's a batch separator for tools. 
        // My previous file didn't use GO, so it should be fine.

        await mssql.query(sql);

        console.log("SP PMS2_New_Sp_OperatorPerformanceLoadingReport created/updated successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Error creating SP:", error);
        process.exit(1);
    }
}

run();
