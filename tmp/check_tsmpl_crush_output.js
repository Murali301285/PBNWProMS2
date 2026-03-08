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

        console.log("Checking TSMPL SP output...");
        const result = await sql.query(`
            EXEC PMS2_New_Sp_ProductionTSMPLReport 
                @Date = '2026-02-17', 
                @ShiftId = 1
        `);

        console.log("TSMPL Crusher Details:", result.recordsets[1]);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();
