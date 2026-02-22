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

async function checkReadingSchema() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Trans.TblEquipmentReading Schema ---");
        const schema = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblEquipmentReading'
            AND COLUMN_NAME LIKE '%Incharge%'
        `);
        console.table(schema.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkReadingSchema();
