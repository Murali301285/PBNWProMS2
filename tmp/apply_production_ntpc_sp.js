
const mssql = require('mssql');
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
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function applySP() {
    try {
        await mssql.connect(config);

        const sql = fs.readFileSync(path.join(__dirname, 'create_production_ntpc_sp_v2.sql'), 'utf-8');

        console.log("Creating PMS2_New_Sp_ProductionNTPCReport...");
        await mssql.query(sql);
        console.log("SP PMS2_New_Sp_ProductionNTPCReport created successfully.");

    } catch (err) {
        console.error("Error creating SP:", err);
    } finally {
        await mssql.close();
    }
}

applySP();
