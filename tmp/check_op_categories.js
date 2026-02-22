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

async function checkOpCategories() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Master.TblOperatorCategory ---");
        const cats = await sql.query("SELECT * FROM Master.TblOperatorCategory");
        console.table(cats.recordset);

        console.log("\n--- Master.TblOperatorSubCategory ---");
        const subCats = await sql.query("SELECT * FROM Master.TblOperatorSubCategory");
        console.table(subCats.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkOpCategories();
