
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

async function restoreSP() {
    try {
        await mssql.connect(config);

        const sql = fs.readFileSync(path.join(__dirname, 'loading_master_sp_clean.sql'), 'utf-8');

        console.log("Restoring SP...");
        await mssql.query(sql);
        console.log("SP PMS2_New_Sp_LoadingMasterReport restored successfully.");

    } catch (err) {
        console.error("Error restoring SP:", err);
    } finally {
        await mssql.close();
    }
}

restoreSP();
