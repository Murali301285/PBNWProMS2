
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
        } else {
            // IDs: Eq: 664, 665. Mat: 1, 2. Shift: 1, 2, 3.
            const insertQuery = `
                INSERT INTO Trans.TblLoading (
                    LoadingDate, ShiftId, MaterialId, LoadingMachineEquipmentId, 
                    HaulerEquipmentId, NoofTrip, TotalQty, IsDelete, CreatedBy, CreatedDate
                )
                VALUES 
                ('${testDate}', 1, 1, 664, 665, 10, 200, 0, 1, GETDATE()), -- Shift 1, Material 1 (TS), Eq 664 (Loader), Eq 665 (Hauler)
                ('${testDate}', 2, 2, 664, 666, 15, 300, 0, 1, GETDATE()), -- Shift 2
                ('${testDate}', 3, 1, 664, 667, 20, 400, 0, 1, GETDATE()); -- Shift 3
            `;

            console.log("Inserting Dummy Loading Data...");
            await pool.request().query(insertQuery);
            console.log("Inserted 3 dummy loading records.");
        }

        const checkRead = await pool.request().query(`SELECT COUNT(*) as C FROM Trans.TblEquipmentReading WHERE Cast(Date as Date) = '${testDate}'`);
        if (checkRead.recordset[0].C > 0) {
            console.log("Reading data already exists. Skipping.");
        } else {
            // IDs: Eq: 664. Sector: 1, 2. Patch: 1. Method: 1.
            const insertReading = `
                INSERT INTO Trans.TblEquipmentReading (
                    Date, ShiftId, EquipmentId, SectorId, PatchId, MethodId, 
                    TotalWorkingHr, IsDelete, CreatedBy, CreatedDate
                )
                VALUES
                ('${testDate}', 1, 664, 1, 1, 1, 8.0, 0, 1, GETDATE()), -- Sector 1
                ('${testDate}', 2, 664, 2, 1, 1, 7.5, 0, 1, GETDATE()), -- Sector 2
                ('${testDate}', 3, 664, 1, 1, 1, 8.0, 0, 1, GETDATE()); -- Sector 1 again
            `;
            console.log("Inserting Dummy Reading Data...");
            await pool.request().query(insertReading);
            console.log("Inserted 3 dummy reading records.");
        }

        await pool.close();

    } catch (error) {
        console.error('Error with corrected IDs:', error);
    }
}

insertDualData();
