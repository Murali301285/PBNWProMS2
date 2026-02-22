const sql = require('mssql');

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

async function inspect() {
    try {
        await sql.connect(config);
        const request = new sql.Request();

        const spName = 'PMS2_New_Dash_SP_Performance_OperatorPerformance';
        console.log(`\n--- Definition of ${spName} ---`);
        const result = await request.query(`SELECT OBJECT_DEFINITION(OBJECT_ID('${spName}')) AS SpDefinition`);

        if (result.recordset.length > 0 && result.recordset[0].SpDefinition) {
            console.log("SP Exists. Definition found.");
        } else {
            console.log("SP does not exist.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

inspect();
