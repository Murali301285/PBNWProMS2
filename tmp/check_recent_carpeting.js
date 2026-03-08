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

        console.log("Most recent Carpeting Works in TblLoading (Top 5)...");
        const loadRes = await sql.query(`
            SELECT TOP 5 LoadingDate, ShiftId, DestinationId, NoofTrip, QtyTrip, TotalQty 
            FROM Trans.TblLoading 
            WHERE IsDelete = 0 AND DestinationId = 10
            ORDER BY LoadingDate DESC
        `);
        console.log("Loading Carpeting:", loadRes.recordset);

        console.log("\\nMost recent OB Rehandling in TblMaterialRehandling (Top 5)...");
        const rehandRes = await sql.query(`
            SELECT TOP 5 RehandlingDate, ShiftId, MaterialId, NoofTrip, QtyTrip, TotalQty 
            FROM Trans.TblMaterialRehandling 
            WHERE IsDelete = 0 AND MaterialId = 5
            ORDER BY RehandlingDate DESC
        `);
        console.log("Rehandling OB:", rehandRes.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();
