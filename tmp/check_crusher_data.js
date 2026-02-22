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

async function checkCrusherData() {
    try {
        await sql.connect(config);

        console.log("--- Checking Master.TblPlant ---");
        const plants = await sql.query(`
            SELECT SlNo, Name, IsDPRReport, IsDelete 
            FROM Master.TblPlant 
            WHERE IsDelete = 0
        `);
        console.table(plants.recordset);

        console.log("\n--- Checking Recent Trans.TblCrusher Data ---");
        const data = await sql.query(`
            SELECT TOP 10 * 
            FROM Trans.TblCrusher 
            ORDER BY Date DESC
        `);
        console.table(data.recordset);

        // Check if there is data for a specific plant that is marked for DPR
        const dprPlants = plants.recordset.filter(p => p.IsDPRReport);
        if (dprPlants.length > 0) {
            const plantId = dprPlants[0].SlNo;
            console.log(`\n--- Checking Data for Plant ID ${plantId} (${dprPlants[0].Name}) ---`);
            const plantData = await sql.query(`
                SELECT COUNT(*) as Count, MAX(Date) as LastDate 
                FROM Trans.TblCrusher 
                WHERE PlantId = ${plantId}
            `);
            console.table(plantData.recordset);
        } else {
            console.log("\nNo plants marked for DPR Report (IsDPRReport = 1)");
        }


    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkCrusherData();
