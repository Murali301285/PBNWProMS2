
const { executeQuery } = require('./lib/db');
const fs = require('fs');
const path = require('path');

async function run() {
    try {
        const sqlPath = path.join(__dirname, 'create_sp_operator_loading_report.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // We can't use executeQuery efficiently for CREATE PROCEDURE block if it has GO statements or similar, 
        // but this file is simple. executeQuery usually expects a query string.
        // Let's use a raw connection approach just to be safe if executeQuery is weird about CREATE PROC

        // Actually, let's try using the standalone connection pattern I used successfully before
        const mssql = require('mssql');
        const config = {
            user: 'sa',
            password: 'Chennai@42',
            server: 'localhost',
            port: 1433,
            database: 'ProMS2_Serv',
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };

        await mssql.connect(config);
        await mssql.query(sql);

        console.log("SP PMS2_New_Sp_OperatorPerformanceLoadingReport created/updated successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Error creating SP:", error);
        process.exit(1);
    }
}

run();
