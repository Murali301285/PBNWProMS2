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

async function checkData() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        // Check columns of TblDrilling again for Qty/Volume
        console.log("Checking Drilling Columns for Qty:");
        const drillCols = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblDrilling' AND COLUMN_NAME LIKE '%Qty%' OR COLUMN_NAME LIKE '%Vol%'
        `);
        console.table(drillCols.recordset);

        // Check if BlastingPatchId exists in Drilling
        console.log("Checking Patch ID Match:");
        const patchMatch = await sql.query(`
            SELECT TOP 5 
                B.BlastingPatchId, 
                B.SMEQty,
                D.DrillingPatchId, 
                D.MaterialId,
                D.TotalQty AS DrillQty,
                D.NoofHoles AS DrillHoles
            FROM Trans.TblBlasting B
            JOIN Trans.TblDrilling D ON B.BlastingPatchId = D.DrillingPatchId
        `);
        console.table(patchMatch.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkData();
