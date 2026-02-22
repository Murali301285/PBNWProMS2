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

async function verifyMetadata() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const result = await sql.query(`
            EXEC PMS2_New_Sp_EquipmentPerformanceReport @Date = '2026-02-11'
        `);

        // Check Metadata for specific columns
        const columns = result.recordset.columns;

        const checkCols = [
            'Shift ATotal Trips', 'Shift ATotal Qty',
            'Shift ATrips Per Hr', 'Shift AQty Per Hr'
        ];

        console.log("\nColumn Types:");
        checkCols.forEach(colName => {
            if (columns[colName]) {
                console.log(`${colName}: ${columns[colName].type.name}`);
            }
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

verifyMetadata();
