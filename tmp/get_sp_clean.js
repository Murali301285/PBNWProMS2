
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

async function getSPDefinition() {
    try {
        await mssql.connect(config);

        const spResult = await mssql.query`
            SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.PMS2_New_Sp_LoadingMasterReport')) AS SP_Definition;
        `;

        const spDef = spResult.recordset[0]?.SP_Definition;
        if (spDef) {
            fs.writeFileSync(path.join(__dirname, 'loading_master_sp_clean.sql'), spDef);
            console.log("SP saved to tmp/loading_master_sp_clean.sql");
        } else {
            console.log("SP Not Found");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mssql.close();
    }
}

getSPDefinition();
