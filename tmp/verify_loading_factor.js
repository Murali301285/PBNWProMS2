
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

async function verifyConversionFactor() {
    try {
        await mssql.connect(config);
        console.log("Connected to database.");

        // 1. Insert a Test Conversion Factor
        const testFactor = 1.99;
        const fromDate = '2026-02-01'; // Range covering current data
        const toDate = '2026-02-28';

        console.log(`Inserting Test Factor: ${testFactor} for range ${fromDate} to ${toDate}`);

        // Ensure clean slate for test
        await mssql.query`DELETE FROM [Master].[TblConversionFactor] WHERE Remarks = 'TestFactorDetails'`;

        await mssql.query`
            INSERT INTO [Master].[TblConversionFactor] 
            (FromDate, ToDate, Factor, Remarks, IsActive, IsDelete, CreatedBy, CreatedDate)
            VALUES (${fromDate}, ${toDate}, ${testFactor}, 'TestFactorDetails', 1, 0, 1, GETDATE())
        `;

        // 2. Execute SP with date in range
        const request = new mssql.Request();
        request.input('FromDate', mssql.Date, '2026-02-15');
        request.input('ToDate', mssql.Date, '2026-02-15');

        console.log("Executing SP for 2026-02-15 (should use 1.99)...");
        const result = await request.execute('[dbo].[PMS2_New_Sp_LoadingMasterReport]');

        if (result.recordset.length > 0) {
            const row = result.recordset[0];
            console.log(`Returned Conversion Factor: ${row.ConversionFactor}`);
            if (row.ConversionFactor === testFactor) {
                console.log("SUCCESS: SP returned correct dynamic factor.");
            } else {
                console.error(`FAILURE: SP returned ${row.ConversionFactor}, expected ${testFactor}`);
            }
        } else {
            console.log("No data returned from SP (expected if no production data), but let's check if column exists at least.");
            if (result.recordset.columns.ConversionFactor) {
                console.log("SUCCESS: ConversionFactor column exists in output.");
            } else {
                console.error("FAILURE: ConversionFactor column MISSING.");
            }
        }

        // 3. Execute SP with date OUT of range
        const request2 = new mssql.Request();
        request2.input('FromDate', mssql.Date, '2025-01-01');
        request2.input('ToDate', mssql.Date, '2025-01-01');

        console.log("Executing SP for 2025-01-01 (should use default 1.55)...");
        const result2 = await request2.execute('[dbo].[PMS2_New_Sp_LoadingMasterReport]');

        if (result2.recordset.length > 0) {
            const row = result2.recordset[0];
            console.log(`Returned Conversion Factor: ${row.ConversionFactor}`);
            if (row.ConversionFactor === 1.55) {
                console.log("SUCCESS: SP returned correct default factor.");
            } else {
                console.error(`FAILURE: SP returned ${row.ConversionFactor}, expected 1.55`);
            }
        } else {
            // If no data, checks columns
            // We can't easily check the value if no rows, but we verified the column exists above.
            console.log("No data for out-of-range test.");
        }

        // Cleanup
        await mssql.query`DELETE FROM [Master].[TblConversionFactor] WHERE Remarks = 'TestFactorDetails'`;
        console.log("Cleanup complete.");

    } catch (err) {
        console.error("Verification Error:", err);
    } finally {
        await mssql.close();
    }
}

verifyConversionFactor();
