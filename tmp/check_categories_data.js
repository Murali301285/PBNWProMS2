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

async function checkCategoriesAndData() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Master.TblCategory ---");
        const cats = await sql.query("SELECT * FROM Master.TblCategory");
        console.table(cats.recordset);

        console.log("\n--- Master.TblSubCategory ---");
        const subCats = await sql.query("SELECT * FROM Master.TblSubCategory");
        console.table(subCats.recordset);

        console.log("\n--- Trans.TblEquipmentReadingShiftIncharge (Top 5) ---");
        const inchargeData = await sql.query(`
            SELECT TOP 5 T.*, O.OperatorName, C.Name as Category
            FROM Trans.TblEquipmentReadingShiftIncharge T
            JOIN Master.TblOperator O ON T.OperatorId = O.SlNo
            LEFT JOIN Master.TblCategory C ON O.CategoryId = C.SlNo
        `);
        console.table(inchargeData.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkCategoriesAndData();
