const sql = require('mssql/msnodesqlv8');

const dbConfig = {
    driver: 'msnodesqlv8',
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\ProjectModels;Database=ProMS_Dev;Trusted_Connection=yes;',
};

async function run() {
    try {
        const pool = await sql.connect(dbConfig);

        console.log("1. Findings recent Equipment Reading with hours...");
        const readingResult = await pool.request().query(`
            SELECT TOP 1 T0.Date, T0.ShiftId, T0.EquipmentId, T2.EquipmentName, T0.TotalWorkingHr
            FROM [Trans].TblEquipmentReading T0
            JOIN [Master].TblEquipment T2 ON T2.SlNo = T0.EquipmentId
            WHERE T0.IsDelete=0 AND T0.TotalWorkingHr > 5
            ORDER BY T0.Date DESC
        `);

        if (readingResult.recordset.length === 0) {
            console.log("No equipment readings found.");
            return;
        }

        const r = readingResult.recordset[0];
        // Ensure date is YYYY-MM-DD
        const dateStr = new Date(r.Date).toISOString().split('T')[0];

        console.log(`\nTarget: Equipment ${r.EquipmentName} (ID: ${r.EquipmentId})`);
        console.log(`Date: ${dateStr}, Shift ID: ${r.ShiftId}`);
        console.log(`Total Working Hr: ${r.TotalWorkingHr}`);

        console.log("\n2. Checking TblLoading (Join Condition matches)...");
        const loadingQuery = `
            SELECT LoadingDate, ShiftId, LoadingMachineEquipmentId, MaterialId, NoofTrip, TotalQty 
            FROM [Trans].TblLoading 
            WHERE IsDelete=0 
            AND CONVERT(date, LoadingDate) = '${dateStr}'
            AND ShiftId = ${r.ShiftId}
            AND LoadingMachineEquipmentId = ${r.EquipmentId}
        `;
        const loadingRes = await pool.request().query(loadingQuery);
        console.table(loadingRes.recordset);

        if (loadingRes.recordset.length === 0) {
            console.log("-> No match in TblLoading with strict join.");

            console.log("\n3. Broad Search in TblLoading (Same Date & Equip)...");
            const broadQuery = `
                SELECT LoadingDate, ShiftId, LoadingMachineEquipmentId, MaterialId, NoofTrip 
                FROM [Trans].TblLoading 
                WHERE IsDelete=0 
                AND CONVERT(date, LoadingDate) = '${dateStr}'
                AND LoadingMachineEquipmentId = ${r.EquipmentId}
            `;
            const broadRes = await pool.request().query(broadQuery);
            console.table(broadRes.recordset);
        }

        console.log("\n4. Checking TblMaterialRehandling...");
        const rehandlingQuery = `
            SELECT RehandlingDate, ShiftId, LoadingMachineEquipmentId, MaterialId, NoofTrip 
            FROM [Trans].TblMaterialRehandling 
            WHERE IsDelete=0 
            AND CONVERT(date, RehandlingDate) = '${dateStr}'
            AND ShiftId = ${r.ShiftId}
            AND LoadingMachineEquipmentId = ${r.EquipmentId}
        `;
        const rehandRes = await pool.request().query(rehandlingQuery);
        console.table(rehandRes.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        sql.close();
    }
}

run();
