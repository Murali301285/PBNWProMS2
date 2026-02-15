
const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_Serv',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

const sql = require('mssql');

async function insertDualData() {
    try {
        console.log(`Connecting to database...`);
        const pool = await new sql.ConnectionPool(config).connect();

        const testDate = '2026-02-15';

        // Check existing count first
        const check = await pool.request().query(`SELECT COUNT(*) as C FROM Trans.TblLoading WHERE LoadingDate = '${testDate}'`);
        if (check.recordset[0].C > 0) {
            console.log("Data already exists. Skipping insertion.");
            return;
        }

        // Insert Dummy Loading Data
        // Need valid IDs for Equipment, Material, Shift, etc.
        // Assuming IDs from previous checks or common values (1, 2, etc.)
        const insertQuery = `
            INSERT INTO Trans.TblLoading (
                LoadingDate, ShiftId, MaterialId, LoadingMachineEquipmentId, 
                HaulerEquipmentId, NoofTrip, TotalQty, IsDelete, CreatedBy, CreatedDate
            )
            VALUES 
            ('${testDate}', 1, 1, 1, 2, 10, 200, 0, 1, GETDATE()), -- Shift 1, Material 1 (TS/OB), Eq 1 (Loader), Eq 2 (Hauler)
            ('${testDate}', 2, 2, 1, 3, 15, 300, 0, 1, GETDATE()), -- Shift 2
            ('${testDate}', 3, 1, 4, 5, 20, 400, 0, 1, GETDATE()); -- Shift 3
        `;

        console.log("Inserting Dummy Loading Data...");
        await pool.request().query(insertQuery);
        console.log("Inserted 3 dummy loading records.");

        // Optionally Insert Reading Data to give Sector Info
        // Assuming TblEquipmentReading links via EqId, Date, ShiftId
        const insertReading = `
            INSERT INTO Trans.TblEquipmentReading (
                Date, ShiftId, EquipmentId, SectorId, PatchId, MethodId, 
                TotalWorkingHr, IsDelete, CreatedBy, CreatedDate
            )
            VALUES
            ('${testDate}', 1, 1, 1, 1, 1, 8.0, 0, 1, GETDATE()), -- Sector 1
            ('${testDate}', 2, 1, 2, 1, 1, 7.5, 0, 1, GETDATE()), -- Sector 2
            ('${testDate}', 3, 4, 1, 1, 1, 8.0, 0, 1, GETDATE()); -- Sector 1 again
        `;
        console.log("Inserting Dummy Reading Data...");
        await pool.request().query(insertReading);
        console.log("Inserted 3 dummy reading records.");


        await pool.close();

    } catch (error) {
        console.error('Error:', error);
    }
}

insertDualData();
