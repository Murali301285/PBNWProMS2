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

async function checkSubCats() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Master.TblOperatorSubCategory ---");
        const subCats = await sql.query("SELECT * FROM Master.TblOperatorSubCategory");
        console.table(subCats.recordset);

        console.log("\n--- Trans.TblEquipmentReadingShiftIncharge Pivot Test ---");
        // Check if we can distinguish Large vs All via SubCategory

        // Find a reading ID that has entries in Incharge table
        const readingIdResult = await sql.query("SELECT TOP 1 EquipmentReadingId FROM Trans.TblEquipmentReadingShiftIncharge");

        if (readingIdResult.recordset.length > 0) {
            const rid = readingIdResult.recordset[0].EquipmentReadingId;
            console.log(`Checking Incharges for ReadingId: ${rid}`);

            const incharges = await sql.query(`
                SELECT T.OperatorId, O.OperatorName, C.Name as Category, SC.Name as SubCategory
                FROM Trans.TblEquipmentReadingShiftIncharge T
                JOIN Master.TblOperator O ON T.OperatorId = O.SlNo
                LEFT JOIN Master.TblOperatorCategory C ON O.CategoryId = C.SlNo
                LEFT JOIN Master.TblOperatorSubCategory SC ON O.SubCategoryId = SC.SlNo
                WHERE T.EquipmentReadingId = ${rid}
            `);
            console.table(incharges.recordset);
        } else {
            console.log("No Incharge records found.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkSubCats();
