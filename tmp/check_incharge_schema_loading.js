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

async function checkInchargeSchema() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const tables = ['TblLoadingShiftIncharge', 'TblEquipmentReadingShiftIncharge'];

        for (const tbl of tables) {
            console.log(`\n--- Schema for Trans.${tbl} ---`);
            const schema = await sql.query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = '${tbl}'
            `);
            console.table(schema.recordset);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkInchargeSchema();
