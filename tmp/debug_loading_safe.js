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

async function checkLoading() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const date = '2026-02-01';

        // Check Loading for any equipment on that date
        const loading = await sql.query(`
            SELECT TOP 10 
                L.SlNo, 
                L.LoadingMachineEquipmentId, 
                L.HaulerEquipmentId, 
                L.ShiftId, 
                S.ShiftName,
                L.NoofTrip, 
                L.TotalQty,
                L.LoadingDate
            FROM Trans.TblLoading L
            LEFT JOIN Master.TblShift S ON L.ShiftId = S.SlNo
            WHERE CAST(L.LoadingDate AS DATE) = '${date}'
             AND L.IsDelete = 0
             AND L.NoofTrip > 0
        `);

        console.log("\nLoading Records for 2026-02-01:");
        console.table(loading.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkLoading();
