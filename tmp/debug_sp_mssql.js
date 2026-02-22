const sql = require('mssql');
const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_1602',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function test() {
    try {
        await sql.connect(config);
        const request = new sql.Request();
        request.input('Date', sql.Date, '2025-08-31');
        const result = await request.query('EXEC PMS2_New_Sp_DailyProductionReport @Date');

        console.log("Total Recordsets:", result.recordsets.length);
        for (let i = 0; i < result.recordsets.length; i++) {
            console.log(`Recordset ${i} length:`, result.recordsets[i].length);
            if (i >= 11) {
                console.log(`Sample of Recordset ${i}:`, result.recordsets[i].slice(0, 2));
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
