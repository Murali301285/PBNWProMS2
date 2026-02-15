
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

async function checkApiLogic() {
    try {
        await mssql.connect(config);

        // Emulating API route logic:
        // const params = [
        //     { name: 'Date', value: date },
        //     { name: 'OperatorIds', value: operatorIds ... }
        // ];

        // But the SP expects @FromDate, @ToDate

        const request = new mssql.Request();
        request.input('Date', mssql.Date, '2026-02-14'); // Mismatch!
        // request.input('OperatorIds', mssql.NVarChar, null);

        console.log("Attempting to execute SP with mismatched parameters...");
        try {
            await request.execute('[dbo].[PMS2_New_Sp_OperatorPerformanceReport]');
        } catch (execError) {
            console.error("Caught Expected Error:", execError.message);
        }

    } catch (err) {
        console.error("Connection Error:", err);
    } finally {
        process.exit();
    }
}

checkApiLogic();
