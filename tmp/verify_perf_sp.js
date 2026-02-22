
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

        console.log(`Executing PMS2_New_Dash_SP_PerformanceDashboard for ${fromDate} to ${toDate}...`);

        const result = await mssql.query`
            EXEC PMS2_New_Dash_SP_PerformanceDashboard @FromDate = ${fromDate}, @ToDate = ${toDate}
        `;

        console.log("Result Sets:", result.recordsets.length);

        const names = ['Highest Production', 'Crusher Wise', 'Sector Wise', 'Operator Performance', 'Loading Performance'];

        result.recordsets.forEach((rs, i) => {
            console.log(`\n[${i}] ${names[i] || 'Unknown'} (Count: ${rs.length})`);
            if (rs.length > 0) {
                console.table(rs.slice(0, 3));
            } else {
                console.log("No Data");
            }
        });

    } catch (err) {
        console.error("SP Execution Error:", err);
    } finally {
        await mssql.close();
    }
}

verifySP();
