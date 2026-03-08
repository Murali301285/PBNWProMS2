
const mssql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
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
        const result = await mssql.query("SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.PMS2_New_Dash_SP_Performance_CoalOBProduction')) AS SpDefinition");

        const spDef = result.recordset[0].SpDefinition;
        if (spDef) {
            fs.writeFileSync(path.join(__dirname, 'coal_ob_sp_clean.sql'), spDef);
            console.log("SP definition written to tmp/coal_ob_sp_clean.sql");
        } else {
            console.log("SP not found or definition is null.");
        }
    } catch (err) {
        console.error("Error fetching SP definition:", err);
    } finally {
        process.exit();
    }
}

getSpDefinition();
