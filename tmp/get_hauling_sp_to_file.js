
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

async function getSP() {
    try {
        await mssql.connect(config);
        const result = await mssql.query`
            SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.PMS2_New_Sp_HaulingMasterReport')) AS SP_Definition;
        `;
        const sp = result.recordset[0]?.SP_Definition;
        if (sp) {
            fs.writeFileSync(path.join(__dirname, 'hauling_sp_def.sql'), sp);
            console.log("SP definition saved to hauling_sp_def.sql");
        } else {
            console.log("SP not found");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

getSP();
