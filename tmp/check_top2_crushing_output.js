const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true }
};

async function checkData() {
    try {
        await sql.connect(config);

        console.log("Executing PMS2_New_Dash_SP_PerformanceDashboard...");
        const result = await sql.query(`
            EXEC PMS2_New_Dash_SP_PerformanceDashboard 
                @FromDate = '2025-01-01', 
                @ToDate = '2026-12-31'
        `);

        const crushingData = result.recordsets[0].filter(r => r.Category === 'Crushing');
        console.log("Crushing Data returned by SP:", crushingData);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();
