
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

async function verifySp() {
    try {
        await mssql.connect(config);

        const params = [
            { name: 'FromDate', type: mssql.Date, value: '2026-02-14' },
            { name: 'ToDate', type: mssql.Date, value: '2026-02-14' }
        ];

        const request = new mssql.Request();
        params.forEach(p => request.input(p.name, p.type, p.value));

        const result = await request.execute('[dbo].[PMS2_New_Sp_OperatorPerformanceReport_Hauling]');

        console.log(`Rows returned: ${result.recordset.length}`);
        if (result.recordset.length > 0) {
            console.table(result.recordset[0]);
        } else {
            console.log("No data returned for today.");
        }

    } catch (err) {
        console.error("Error executing SP:", err);
    } finally {
        process.exit();
    }
}

verifySp();
