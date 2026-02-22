
const mssql = require('mssql');

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

async function getSPDefinition() {
    try {
        await mssql.connect(config);
        const result = await mssql.query`SELECT OBJECT_DEFINITION(OBJECT_ID('PMS2_New_Sp_DailyProductionReport')) AS SpDefinition`;
        if (result.recordset.length > 0 && result.recordset[0].SpDefinition) {
            console.log(result.recordset[0].SpDefinition);
        } else {
            console.log("SP not found or empty definition.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mssql.close();
    }
}

getSPDefinition();
