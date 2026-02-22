
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

async function verifyHaulingReportSP() {
    try {
        await mssql.connect(config);
        console.log("Connected to database.");

        const request = new mssql.Request();

        // Matches the logic in route.js
        const fromDate = '2025-02-01';
        const toDate = '2025-02-10';
        const shiftIds = '';
        const operatorIds = '';
        const haulerIds = '';
        const haulerModelIds = '';

        request.input('fromDateInput', mssql.Date, fromDate);
        request.input('toDateInput', mssql.Date, toDate);
        request.input('shiftIds', mssql.NVarChar, shiftIds);
        request.input('operatorIds', mssql.NVarChar, operatorIds);
        request.input('haulerIds', mssql.NVarChar, haulerIds);
        request.input('haulerModelIds', mssql.NVarChar, haulerModelIds);

        console.log("Executing [dbo].[PMS2_New_Sp_HaulingMasterReport]...");
        const result = await request.execute('[dbo].[PMS2_New_Sp_HaulingMasterReport]');

        console.log("SP Execution Successful.");
        console.log("Record count:", result.recordset ? result.recordset.length : 0);
        if (result.recordset && result.recordset.length > 0) {
            console.log("First record:", result.recordset[0]);
        }

    } catch (err) {
        console.error("Verification Exec Error:", err);
    } finally {
        await mssql.close();
    }
}

verifyHaulingReportSP();
