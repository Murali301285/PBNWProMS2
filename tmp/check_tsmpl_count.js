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

async function checkTSMPL() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        // Check if there is ANY data for Carpeting (Dest 10) in Loading
        console.log("\n--- Trans.TblLoading count for DestinationId 10 ---");
        const carpetingCount = await sql.query("SELECT COUNT(*) as Count, MAX(LoadingDate) as LastDate FROM Trans.TblLoading WHERE DestinationId = 10");
        console.table(carpetingCount.recordset);

        // Check if there is ANY data in Rehandling table
        console.log("\n--- Trans.TblMaterialRehandling count ---");
        const rehandCount = await sql.query("SELECT COUNT(*) as Count, MAX(RehandlingDate) as LastDate FROM Trans.TblMaterialRehandling");
        console.table(rehandCount.recordset);

        // Check active materials
        console.log("\n--- Material List ---");
        const mats = await sql.query("SELECT SlNo, MaterialName FROM Master.TblMaterial WHERE MaterialName LIKE '%Rehand%' OR MaterialName LIKE '%Coal%'");
        console.table(mats.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkTSMPL();
