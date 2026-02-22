
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

        const fromDate = '2025-12-01';
        const toDate = '2026-01-01';

        console.log(`Executing PMS2_New_Dash_SP_CrushingDashboard for ${fromDate} to ${toDate}...`);

        const result = await mssql.query`
            EXEC PMS2_New_Dash_SP_CrushingDashboard @FromDate = ${fromDate}, @ToDate = ${toDate}
        `;

        console.log("Result Sets:", result.recordsets.length);

        if (result.recordsets.length >= 1) {
            console.log("Transactions (First 5):");
            console.table(result.recordsets[0].slice(0, 5));
        }

        if (result.recordsets.length >= 2) {
            console.log("Stoppages Summary (First 5):");
            console.table(result.recordsets[1].slice(0, 5));
        }

        if (result.recordsets.length >= 3) {
            console.log("Stoppage Log (First 5):");
            console.table(result.recordsets[2].slice(0, 5));
        }

    } catch (err) {
        console.error("SP Execution Error:", err);
    } finally {
        await mssql.close();
    }
}

verifySP();
