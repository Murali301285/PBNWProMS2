
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function findDataDate() {
    try {
        await sql.connect(config);

        console.log("Checking Reading Data Range...");
        const res = await sql.query(`
            SELECT TOP 5 Cast([Date] as Date) as DataDate, Count(*) as RecCount 
            FROM [Trans].[TblEquipmentReading] 
            WHERE IsDelete=0 
            GROUP BY Cast([Date] as Date) 
            ORDER BY DataDate DESC
        `);
        console.table(res.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

findDataDate();
