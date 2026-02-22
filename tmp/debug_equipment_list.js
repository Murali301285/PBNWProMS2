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

async function listEquipment() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const result = await sql.query(`
            SELECT TOP 20 SlNo, EquipmentName, PMSCode
            FROM Master.TblEquipment
            WHERE IsDelete = 0
            ORDER BY SlNo DESC
        `);
        console.table(result.recordset);

        // Also try fuzzy search for the specific code
        const fuzzy = await sql.query(`
            SELECT SlNo, EquipmentName, PMSCode
            FROM Master.TblEquipment
            WHERE PMSCode LIKE '%2000799%'
        `);
        console.log("\nFuzzy Search for 2000799:");
        console.table(fuzzy.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

listEquipment();
