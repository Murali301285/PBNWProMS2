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

async function findData() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const eqId = 771; // Kom-255

        const result = await sql.query(`
            SELECT TOP 5 Date, ShiftId, TotalWorkingHr, IsDelete 
            FROM Trans.TblEquipmentReading 
            WHERE EquipmentId = ${eqId} 
             AND Date >= '2026-02-01' 
             AND Date < '2026-03-01'
             ORDER BY Date DESC
        `);

        console.log("\nFound Readings:");
        console.table(result.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

findData();
