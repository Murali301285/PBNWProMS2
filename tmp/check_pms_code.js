require('dotenv').config({ path: '.env.local' });
const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
    },
};

async function checkTblEquipment() {
    let pool;
    try {
        pool = await sql.connect(config);
        const triggers = await pool.request().query("SELECT name FROM sys.triggers WHERE parent_id = OBJECT_ID('Master.TblEquipment')");
        console.log("Triggers:");
        console.dir(triggers.recordset);
        
        const latestRows = await pool.request().query("SELECT TOP 5 SlNo, PMSCode, CreatedDate FROM Master.TblEquipment ORDER BY SlNo DESC");
        console.log("Latest Rows:");
        console.dir(latestRows.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        if (pool) pool.close();
    }
}
checkTblEquipment();
