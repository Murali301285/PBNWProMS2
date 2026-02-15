
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

async function checkSchema() {
    try {
        await sql.connect(config);

        console.log("--- TblActivity ---");
        const activity = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblActivity'
        `);
        console.table(activity.recordset);

        console.log("--- TblEquipment ---");
        const equipment = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblEquipment'
        `);
        console.table(equipment.recordset);

        console.log("--- TblShift ---");
        const shift = await sql.query(`
            SELECT * FROM [Master].[TblShift]
        `);
        console.table(shift.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

checkSchema();
