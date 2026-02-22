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

async function debugData() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("--- Activity Master ---");
        const activities = await sql.query("SELECT SlNo, Name FROM Master.TblActivity");
        console.table(activities.recordset);

        console.log("\n--- Checking Equipment Activity ---");
        // Get some equipment that likely appears in the report (from TblEquipmentReading for a recent date)
        const readingCheck = await sql.query(`
            SELECT TOP 5 E.EquipmentName, E.ActivityId, E.Model, ER.Date, ER.ShiftId
            FROM Trans.TblEquipmentReading ER
            JOIN Master.TblEquipment E ON ER.EquipmentId = E.SlNo
            WHERE ER.Date >= '2026-02-01' 
            ORDER BY ER.Date DESC
        `);
        console.table(readingCheck.recordset);

        console.log("\n--- Checking Loading Data ---");
        // Check loading data for one of the equipments found above
        if (readingCheck.recordset.length > 0) {
            const eqName = readingCheck.recordset[0].EquipmentName;
            const eqDate = readingCheck.recordset[0].Date;

            console.log(`Checking Loading for ${eqName} on ${eqDate.toISOString().split('T')[0]}`);

            const loadingData = await sql.query(`
                SELECT L.LoadingMachineEquipmentId, E.EquipmentName, L.LoadingDate, L.MaterialId, L.NoofTrip, L.TotalQty
                FROM Trans.TblLoading L
                JOIN Master.TblEquipment E ON L.LoadingMachineEquipmentId = E.SlNo
                WHERE E.EquipmentName = '${eqName}'
                AND CAST(L.LoadingDate AS DATE) = CAST('${eqDate.toISOString()}' AS DATE)
            `);
            console.table(loadingData.recordset);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

debugData();
