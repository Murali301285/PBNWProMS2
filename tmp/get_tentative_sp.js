
const mssql = require('mssql');

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

async function getSPDefinition() {
    try {
        await mssql.connect(config);
        const result = await mssql.query`
            SELECT OBJECT_DEFINITION(OBJECT_ID('ProMS2_SPReportTentativeProduction')) AS SP_Definition;
        `;
        console.log(result.recordset[0].SP_Definition);
    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

getSPDefinition();
