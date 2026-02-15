
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

async function checkBlastingData() {
    try {
        await sql.connect(config);

        console.log("--- Activity: Blasting ---");
        const activity = await sql.query("SELECT * FROM [Master].[TblActivity] WHERE Name LIKE '%Blasting%'");
        console.table(activity.recordset);

        if (activity.recordset.length > 0) {
            const blastingId = activity.recordset[0].SlNo;
            console.log(`--- Equipment for ActivityId: ${blastingId} ---`);
            const equipment = await sql.query(`SELECT SlNo, EquipmentName, ActivityId FROM [Master].[TblEquipment] WHERE ActivityId = ${blastingId}`);
            console.table(equipment.recordset);

            if (equipment.recordset.length === 0) {
                console.log("No equipment found for Blasting.");
            }
        } else {
            console.log("Blasting activity not found.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkBlastingData();
