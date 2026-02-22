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

async function checkSchema() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const query = `
            SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME IN ('TblCrusher', 'TblPlant')
            ORDER BY TABLE_NAME, COLUMN_NAME;
        `;

        const result = await sql.query(query);
        console.table(result.recordset);

        // Also check some plant names
        const plants = await sql.query("SELECT SlNo, PlantName FROM Master.TblPlant");
        console.table(plants.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkSchema();
