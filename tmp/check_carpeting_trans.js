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

        console.log("Checking Carpeting in TblLoading for Feb 17...");
        const loadRes = await sql.query(`
            SELECT TOP 5 LoadingDate, ShiftId, DestinationId, NoofTrip, QtyTrip 
            FROM Trans.TblLoading 
            WHERE IsDelete = 0 AND Convert(DATE, LoadingDate) = '2026-02-17' 
              AND DestinationId = 10
        `);
        console.log("Loading Carpeting:", loadRes.recordset);

        console.log("\\nChecking OB Rehandling in TblMaterialRehandling for Feb 17...");
        const rehandRes = await sql.query(`
            SELECT TOP 5 RehandlingDate, ShiftId, MaterialId, NoofTrip, QtyTrip 
            FROM Trans.TblMaterialRehandling 
            WHERE IsDelete = 0 AND Convert(DATE, RehandlingDate) = '2026-02-17' 
              AND MaterialId = 5
        `);
        console.log("Rehandling OB:", rehandRes.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();
