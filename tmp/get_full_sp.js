
const mssql = require('mssql');
const fs = require('fs');

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

async function getFullSP() {
    try {
        await mssql.connect(config);
        const result = await mssql.query`
            SELECT OBJECT_DEFINITION(OBJECT_ID('ProMS2_SPReportTentativeProduction')) AS SP_Definition;
        `;
        const def = result.recordset[0].SP_Definition;
        fs.writeFileSync('tmp/full_sp_def.sql', def);
        console.log("SP Definition saved to tmp/full_sp_def.sql");

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

getFullSP();
