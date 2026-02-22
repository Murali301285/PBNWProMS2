
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

async function verifySP() {
    try {
        await mssql.connect(config);

        // Use a date range that likely has data (e.g., current month or recent past)
        // Or just use the current date as per dashboard logic
        const fromDate = '2026-02-01'; // Start of month
        const toDate = '2026-02-16'; // Today (simulated)

        console.log(`Executing PMS2_New_Dash_SP_GetAnalyticalStats for ${fromDate} to ${toDate}...`);

        const result = await mssql.query`
            EXEC PMS2_New_Dash_SP_GetAnalyticalStats @FromDate = ${fromDate}, @ToDate = ${toDate}
        `;

        console.log("Result Sets:", result.recordsets.length);

        if (result.recordsets.length >= 1) {
            console.log("KPIs (First 5):");
            console.table(result.recordsets[0].slice(0, 5));
        }

        if (result.recordsets.length >= 2) {
            console.log("Details (First 5):");
            console.table(result.recordsets[1].slice(0, 5));
        }

        if (result.recordsets.length >= 3) {
            console.log("Hauling Chart (First 5):");
            console.table(result.recordsets[2].slice(0, 5));
        }

        if (result.recordsets.length >= 4) {
            console.log("Loading Chart (First 5):");
            console.table(result.recordsets[3].slice(0, 5));
        }

    } catch (err) {
        console.error("SP Execution Error:", err);
    } finally {
        await mssql.close();
    }
}

verifySP();
