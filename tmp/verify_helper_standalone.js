
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function testHelperAPI() {
    try {
        await sql.connect(config);

        console.log("Fetching Activities...");
        const activities = await sql.query('SELECT SlNo as id, Name as name FROM [Master].[TblActivity] WHERE IsDelete = 0 AND IsActive = 1 ORDER BY Name');
        console.log(`Activities found: ${activities.recordset.length}`);
        if (activities.recordset.length > 0) console.table(activities.recordset.slice(0, 5));

        console.log("Fetching Equipment...");
        const equipment = await sql.query('SELECT SlNo as id, EquipmentName as name, ActivityId FROM [Master].[TblEquipment] WHERE IsDelete = 0 AND Active = 1 ORDER BY EquipmentName');
        console.log(`Equipment found: ${equipment.recordset.length}`);
        if (equipment.recordset.length > 0) console.table(equipment.recordset.slice(0, 5));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

testHelperAPI();
