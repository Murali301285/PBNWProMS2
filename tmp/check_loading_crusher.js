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

        console.log("Checking if crusher data exists in Loading table...");
        const result = await sql.query(`
            SELECT TOP 10 L.LoadingDate, L.ShiftId, D.Name as Destination, L.TotalQty
            FROM Trans.TblLoading L
            LEFT JOIN Master.TblDestination D ON L.DestinationId = D.SlNo
            WHERE L.IsDelete = 0 
            AND D.Name LIKE '%Crush%' OR D.Name LIKE '%CHP%'
            ORDER BY L.LoadingDate DESC
        `);
        console.log("Loading to Crusher/CHP Data:", result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkData();
