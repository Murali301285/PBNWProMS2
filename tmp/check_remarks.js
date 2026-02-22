const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_1602',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkRemarks() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Loading Data with 'Carpet' in Remarks ---");
        const data = await sql.query(`
            SELECT TOP 10 * 
            FROM Trans.TblLoading 
            WHERE Remarks LIKE '%Carpet%'
            ORDER BY LoadingDate DESC
        `);
        console.table(data.recordset);

        console.log("\n--- Destination Names in Loading recently (Distinct) ---");
        const dests = await sql.query(`
            SELECT DISTINCT T1.Name, T0.DestinationId
            FROM Trans.TblLoading T0
            JOIN Master.TblDestination T1 ON T0.DestinationId = T1.SlNo
            WHERE T0.LoadingDate > DATEADD(day, -30, GETDATE())
        `);
        console.table(dests.recordset);


    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkRemarks();
