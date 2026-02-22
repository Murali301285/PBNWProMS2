
const mssql = require('mssql');
const fs = require('fs');
const path = require('path');

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

async function applySP() {
    try {
        await mssql.connect(config);

        const sql = fs.readFileSync(path.join(__dirname, 'update_loading_master_report_sp.sql'), 'utf-8');

        console.log("Applying SP Update...");
        await mssql.query(sql);
        console.log("SP PMS2_New_Sp_LoadingMasterReport updated successfully.");

    } catch (err) {
        console.error("Error applying SP:", err);
    } finally {
        await mssql.close();
    }
}

applySP();
