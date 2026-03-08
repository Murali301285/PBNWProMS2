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

        console.log("Executing SP for 2026-02-17...");
        const result = await sql.query(`
            EXEC PMS2_New_Dash_SP_PerformanceDashboard 
                @FromDate = '2026-02-17', 
                @ToDate = '2026-02-17'
        `);

        console.log("All Highest Production for 17-Feb-2026:", result.recordsets[0]);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();
