
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

const fs = require('fs');
const path = require('path');

async function getSpDefinition() {
    try {
        await mssql.connect(config);
        const result = await mssql.query("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.PMS2_New_Sp_LoadingMasterReport')) AS SpDefinition");

        const spDef = result.recordset[0].SpDefinition;
        fs.writeFileSync(path.join(__dirname, 'loading_master_sp_clean.sql'), spDef);
        console.log("SP definition written to tmp/loading_master_sp_clean.sql");
    } catch (err) {
        console.error("Error fetching SP definition:", err);
    } finally {
        process.exit();
    }
}

getSpDefinition();
