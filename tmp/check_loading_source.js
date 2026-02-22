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

async function checkLoadingCols() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Trans.TblLoading Schema ---");
        const schema = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = 'TblLoading'
            AND (COLUMN_NAME LIKE '%Sector%' OR COLUMN_NAME LIKE '%Source%' OR COLUMN_NAME LIKE '%Pit%')
        `);
        console.table(schema.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkLoadingCols();
