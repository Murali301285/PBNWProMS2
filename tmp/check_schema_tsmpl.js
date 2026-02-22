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

        console.log("\n--- Master.TblMaterial Schema ---");
        const matSchema = await sql.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblMaterial'
        `);
        console.table(matSchema.recordset);

        console.log("\n--- Master.TblMaterial Data (First 5) ---");
        const matData = await sql.query("SELECT TOP 5 * FROM Master.TblMaterial");
        console.table(matData.recordset);

        console.log("\n--- Search Destinations for 'Carpeting' ---");
        const dest = await sql.query("SELECT * FROM Master.TblDestination WHERE Name LIKE '%Carpet%'");
        console.table(dest.recordset);

        console.log("\n--- Search Materials for 'Rehandling' or 'Coal' ---");
        // Using * to avoid column name guess work
        const mats = await sql.query("SELECT * FROM Master.TblMaterial WHERE Name LIKE '%Rehand%' OR Name LIKE '%Coal%'");
        // Wait, I used 'Name' before and it failed? Maybe it's 'MaterialName'?
        // I will rely on the schema check above to know the column name.
        // For now, let's just dump the table or use * if I can.

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkSchema();
