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

async function analyzeCoal() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const targetDate = '2026-02-11';

        console.log(`\n--- Coal (Mat 7) Breakdown for ${targetDate} ---`);
        const data = await sql.query(`
            SELECT 
                L.DestinationId, 
                D.Name as DestinationName,
                D2.FillingPoint as FillingPointName,
                COUNT(*) as Count,
                SUM(L.TotalQty) as TotalQty
            FROM Trans.TblLoading L
            LEFT JOIN Master.TblDestination D ON L.DestinationId = D.SlNo
            LEFT JOIN Master.tblFillingPoint D2 ON L.DestinationId = D2.SlNo
            WHERE L.MaterialId = 7
            AND CAST(L.LoadingDate AS DATE) = '${targetDate}'
            GROUP BY L.DestinationId, D.Name, D2.FillingPoint
        `);
        console.table(data.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

analyzeCoal();
