import { executeQuery, getDbConnection } from '../lib/db.js';

// TEST VERSION - NO NEXT.JS HEADERS
// import { cookies } from 'next/headers';

async function checkDDL() {
    try {
        console.log("Connecting to DB...");
        const pool = await getDbConnection();
        console.log("Connected.");

        console.log("\n--- Checking TblShift ---");
        const shifts = await pool.request().query("SELECT * FROM [Master].[TblShift]");
        console.log(`Count: ${shifts.recordset.length}`);
        if (shifts.recordset.length > 0) {
            console.log("First Shift:", shifts.recordset[0]);
        } else {
            console.log("WARNING: TblShift is empty!");
        }

        console.log("\n--- Checking TblOperator (SubCategoryId Stats) ---");
        const ops = await pool.request().query("SELECT SubCategoryId, COUNT(*) as Count FROM [Master].[TblOperator] GROUP BY SubCategoryId");
        console.table(ops.recordset);

        console.log("\n--- Checking Incharge (SubCat=1) Sample ---");
        const incharge = await pool.request().query("SELECT TOP 5 SlNo, OperatorName, OperatorId, SubCategoryId, IsActive, IsDelete FROM [Master].[TblOperator] WHERE SubCategoryId = 1");
        console.table(incharge.recordset);

        console.log("\n--- Checking Driver (SubCat=2) Sample ---");
        const driver = await pool.request().query("SELECT TOP 5 SlNo, OperatorName, OperatorId, SubCategoryId, IsActive, IsDelete FROM [Master].[TblOperator] WHERE SubCategoryId = 2");
        console.table(driver.recordset);

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        process.exit();
    }
}

checkDDL();
