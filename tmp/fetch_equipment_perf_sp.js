const sql = require('mssql');
const fs = require('fs');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function getSP() {
    try {
        const pool = await sql.connect(config);
        const res = await pool.request().query(`
            SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.PMS2_New_Sp_EquipmentPerformanceReport')) AS sp_definition
        `);

        if (res.recordset.length > 0 && res.recordset[0].sp_definition) {
            fs.writeFileSync('f:/Dev/ProMS/ProMSDev/tmp/current_sp_equipment_performance_report.sql', res.recordset[0].sp_definition);
            console.log("SP saved to f:/Dev/ProMS/ProMSDev/tmp/current_sp_equipment_performance_report.sql");
        } else {
            console.log("SP not found.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

getSP();
