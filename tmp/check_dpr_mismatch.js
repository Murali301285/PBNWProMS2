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

async function checkSpecificDate() {
    try {
        await sql.connect(config);

        const targetDate = '2025-12-30';

        console.log(`\n--- Plants marked for DPR (IsDPRReport = 1) ---`);
        const dprPlants = await sql.query(`
            SELECT SlNo, Name 
            FROM Master.TblPlant 
            WHERE IsDPRReport = 1 AND IsDelete = 0
        `);
        console.table(dprPlants.recordset);

        console.log(`\n--- Crusher Data for ${targetDate} ---`);
        // Group by PlantId to see where the data is
        const data = await sql.query(`
            SELECT PlantId, SUM(ProductionQty) as TotalQty, COUNT(*) as Records
            FROM Trans.TblCrusher 
            WHERE CAST(Date AS DATE) = '${targetDate}'
            GROUP BY PlantId
        `);
        console.table(data.recordset);

        // Result analysis
        const activeIds = dprPlants.recordset.map(p => p.SlNo);
        const dataIds = data.recordset.map(d => d.PlantId);

        console.log("\n--- Analysis ---");
        console.log("Visible Plant IDs:", activeIds);
        console.log("IDs with Data:", dataIds);

        const visibleData = dataIds.filter(id => activeIds.includes(id));
        const hiddenData = dataIds.filter(id => !activeIds.includes(id));

        if (visibleData.length === 0 && hiddenData.length > 0) {
            console.log("ISSUE FOUND: Data exists but only for plants NOT in the report.");
            console.log(`Data found for Plant IDs: ${hiddenData.join(', ')}`);
        } else if (dataIds.length === 0) {
            console.log("ISSUE FOUND: No data found for this date at all.");
        } else {
            console.log("Data should be visible for IDs:", visibleData.join(', '));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkSpecificDate();
