
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

async function getSpDefinition() {
    try {
        await mssql.connect(config);
        const result = await mssql.query("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.PMS2_New_Sp_HaulingMasterReport')) AS SpDefinition");

        const spDef = result.recordset[0].SpDefinition;
        if (spDef) {
            fs.writeFileSync(path.join(__dirname, 'hauling_master_sp.sql'), spDef);
            console.log("SP definition written to tmp/hauling_master_sp.sql");
        } else {
            console.log("SP definition not found or NULL");
        }
    } catch (err) {
        console.error("Error fetching SP definition:", err);
    } finally {
        process.exit();
    }
}

getSpDefinition();
