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

async function checkTSMPLData() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Check Carpeting Destination ID ---");
        const dest = await sql.query("SELECT * FROM Master.TblDestination WHERE Name LIKE '%Carpet%'");
        console.table(dest.recordset);

        console.log("\n--- Check OB Rehandling Material ID ---");
        // Just select * to be safe or check schema first. Let's try MaterialName which is common.
        // Or just print all to see.
        const mat = await sql.query("SELECT * FROM Master.TblMaterial WHERE Material LIKE '%Rehand%' OR Material LIKE '%OB%'");
        // Logic: Try 'Material' column if 'Name' failed, or just dump all materials.
        console.table(mat.recordset);

        console.log("\n--- All Destinations with 'Carpet' ---");
        const destAll = await sql.query("SELECT * FROM Master.TblDestination WHERE Name LIKE '%Carpet%'");
        console.table(destAll.recordset);

        // Check recent data in TblMaterialRehandling
        console.log("\n--- Recent TblMaterialRehandling Data ---");
        const rehand = await sql.query("SELECT TOP 10 * FROM Trans.TblMaterialRehandling ORDER BY RehandlingDate DESC");
        console.table(rehand.recordset);

        // Check recent Loading for Carpeting (using ID found above, likely 10 but let's see)
        // Note: SP uses 10.
        console.log("\n--- Recent Loading for Carpeting (Dest 10) ---");
        const load = await sql.query("SELECT TOP 10 * FROM Trans.TblLoading WHERE DestinationId = 10 ORDER BY LoadingDate DESC");
        console.table(load.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkTSMPLData();
