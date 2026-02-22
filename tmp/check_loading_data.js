const sql = require('mssql/msnodesqlv8');

const dbConfig = {
    driver: 'msnodesqlv8',
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\ProjectModels;Database=ProMS_Dev;Trusted_Connection=yes;',
};

async function run() {
    try {
        const pool = await sql.connect(dbConfig);

        // 1. Get a recent EquipmentReading entry with Working Hours
        console.log("Checking recent Equipment Readings...");
        const readingResult = await pool.request().query(`
            SELECT TOP 5 T0.Date, T0.ShiftId, T0.EquipmentId, T2.EquipmentName, T0.TotalWorkingHr
            FROM [Trans].TblEquipmentReading T0
            JOIN [Master].TblEquipment T2 ON T2.SlNo = T0.EquipmentId
            WHERE T0.IsDelete=0 AND T0.TotalWorkingHr > 0
            ORDER BY T0.Date DESC
        `);

        const readings = readingResult.recordset;
        console.log(`Found ${readings.length} readings.`);
        console.table(readings);

        if (readings.length > 0) {
            const r = readings[0];
            const dateStr = r.Date.toISOString().split('T')[0];

            console.log(`\nChecking TblLoading for Equipment: ${r.EquipmentName} (${r.EquipmentId}) on Date: ${dateStr} Shift: ${r.ShiftId}`);

            // 2. Check TblLoading for this specific combination
            const loadingResult = await pool.request().query(`
                SELECT TOP 5 * 
                FROM [Trans].TblLoading
                WHERE IsDelete=0 
                AND LoadingMachineEquipmentId = ${r.EquipmentId}
                AND CONVERT(date, LoadingDate) = '${dateStr}'
                AND ShiftId = ${r.ShiftId}
            `);

            console.log(`Found ${loadingResult.recordset.length} matches in TblLoading.`);
            if (loadingResult.recordset.length > 0) {
                console.table(loadingResult.recordset);
            } else {
                console.log("No exact match found in TblLoading.");

                // 3. Broaden search: Check ANY loading data for this equipment
                console.log("\nChecking ANY loading data for this equipment (any date):");
                const broadResult = await pool.request().query(`
                    SELECT TOP 5 LoadingDate, ShiftId, MaterialId, NoofTrip, TotalQty 
                    FROM [Trans].TblLoading
                    WHERE IsDelete=0 AND LoadingMachineEquipmentId = ${r.EquipmentId}
                    ORDER BY LoadingDate DESC
                `);
                console.table(broadResult.recordset);

                // 4. Check Materials
                console.log("\nChecking Material IDs:");
                const matResult = await pool.request().query(`SELECT SlNo, MaterialName FROM [Master].TblMaterial`);
                console.table(matResult.recordset);
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        sql.close();
    }
}

run();
