
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

async function verifySPs() {
    try {
        const pool = await mssql.connect(config);

        const date = '2024-11-20';

        // 1. Verify Daily Progress
        console.log("--- Verifying Daily Progress ---");
        const dailyResult = await pool.request()
            .input('Date', mssql.Date, date)
            .execute('PMS2_New_Sp_DailyProgressReport');

        const headerInfo = dailyResult.recordsets[4]?.[0];
        console.log("Daily Progress Header:", headerInfo);


        // 2. Verify Hauling Master
        console.log("\n--- Verifying Hauling Master ---");

        const haulingResult = await pool.request()
            .input('fromDateInput', mssql.Date, date)
            .input('toDateInput', mssql.Date, date)
            .input('shiftIds', mssql.NVarChar, null)
            .input('operatorIds', mssql.NVarChar, null)
            .input('haulerIds', mssql.NVarChar, null)
            .input('haulerModelIds', mssql.NVarChar, null)
            .execute('PMS2_New_Sp_HaulingMasterReport');

        const haulingRow = haulingResult.recordset?.[0];
        if (haulingResult.recordset.length > 0) {
            console.log("Hauling Master Row 1 (Partial):", {
                "ConversionFactor": haulingRow.ConversionFactor,
                "Quantity (BCM)": haulingRow['Quantity (BCM)'],
                "Trip/Hrs": haulingRow['Trip/Hrs']
            });
            // Check if commas are present in a large number string
            if (haulingRow['Quantity (BCM)'].includes(',')) {
                console.log("Formatting Verification: Strings contain commas.");
            } else {
                console.log("Formatting Verification: No commas found (might be small number or error). Value: " + haulingRow['Quantity (BCM)']);
            }
        } else {
            // Try to find a date with data if possible, or just accept execution success
            console.log("Hauling Master: No data returned for this date, but SP executed successfully.");
        }


    } catch (err) {
        console.error("Verification Error:", err);
    } finally {
        await mssql.close();
    }
}

verifySPs();
