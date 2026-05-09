const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_2203',
    options: { encrypt: false, trustServerCertificate: true }
};

async function run() {
    try {
        await sql.connect(config);

        console.log("--- TblDestination Check ---");
        const res3 = await sql.query(`SELECT TOP 5 * FROM [Master].[TblDestination] WHERE SlNo IN (1, 36)`);
        console.log(res3.recordset);

        console.log("--- tblFillingPoint Check ---");
        const res4 = await sql.query(`SELECT TOP 5 * FROM [Master].[tblFillingPoint]`);
        console.log(res4.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
