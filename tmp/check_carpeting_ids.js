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

        console.log("Checking Master.TblDestination for Carpeting...");
        const destRes = await sql.query(`SELECT SlNo, Name FROM Master.TblDestination WHERE Name LIKE '%carpet%' OR Name LIKE '%Carpet%' OR SlNo = 10`);
        console.log("Destinations:", destRes.recordset);

        console.log("\\nChecking Master.TblMaterial for OB Rehandling...");
        const matRes = await sql.query(`SELECT SlNo, MaterialName FROM Master.TblMaterial WHERE MaterialName LIKE '%Rehandl%' OR SlNo = 5`);
        console.log("Materials:", matRes.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();
