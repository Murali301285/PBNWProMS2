const sql = require('mssql');
const fs = require('fs');
const path = require('path');

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

async function runSqlFile() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const sqlContent = fs.readFileSync(path.join(__dirname, 'sp_ntpc_fix.sql'), 'utf8');

        await sql.query(sqlContent);
        console.log("SP PMS2_New_Sp_ProductionNTPCReport Updated Successfully");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

runSqlFile();
