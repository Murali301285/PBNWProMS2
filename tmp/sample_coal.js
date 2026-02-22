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

async function sampleCoal() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const data = await sql.query(`
            SELECT TOP 50
                L.DestinationId, 
                D.FillingPoint as DestName_FillingPoint, 
                D2.Name as DestName_Destination,
                L.LoadingDate,
                L.ShiftId
            FROM Trans.TblLoading L
            LEFT JOIN Master.tblFillingPoint D ON L.DestinationId = D.SlNo
            LEFT JOIN Master.TblDestination D2 ON L.DestinationId = D2.SlNo
            WHERE L.MaterialId = 7 -- Coal
            ORDER BY L.LoadingDate DESC
        `);
        console.table(data.recordset);

        // Also check if there is any destination named 'WP%' in Master tables again, 
        // maybe I missed something or case sensitivity.
        const d1 = await sql.query("SELECT SlNo, Name FROM Master.TblDestination WHERE Name LIKE '%WP%'");
        console.table(d1.recordset);

        const d2 = await sql.query("SELECT SlNo, FillingPoint FROM Master.tblFillingPoint WHERE FillingPoint LIKE '%WP%'");
        console.table(d2.recordset);


    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

sampleCoal();
