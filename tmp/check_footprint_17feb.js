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

        console.log("Summary of all Loading on 17-Feb-2026 by Destination and Material:");
        const loadRes = await sql.query(`
            SELECT 
                L.DestinationId, 
                D.Name AS DestinationName,
                L.MaterialId,
                M.MaterialName,
                COUNT(*) AS TripCount, 
                SUM(L.TotalQty) AS SumTotalQty 
            FROM Trans.TblLoading L
            LEFT JOIN Master.TblDestination D ON L.DestinationId = D.SlNo
            LEFT JOIN Master.TblMaterial M ON L.MaterialId = M.SlNo
            WHERE L.IsDelete = 0 AND Convert(DATE, L.LoadingDate) = '2026-02-17'
            GROUP BY L.DestinationId, D.Name, L.MaterialId, M.MaterialName
            ORDER BY SumTotalQty DESC
        `);
        console.table(loadRes.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();
