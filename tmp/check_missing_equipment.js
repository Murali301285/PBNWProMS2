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

async function checkMissingEquipment() {
    let pool;
    try {
        pool = await sql.connect(config);
        
        // Find CostCenters in TempEquipmentUpload that do NOT exist in TblEquipment
        const result = await pool.request().query(`
            SELECT 
                t.[CostCenter], 
                t.[EquipmentModel], 
                t.[EquipmentLongText], 
                t.[EquipmentShortText]
            FROM [dbo].[TempEquipmentUpload] t
            WHERE NOT EXISTS (
                SELECT 1 
                FROM [Master].[TblEquipment] e 
                WHERE e.[CostCenter] = t.[CostCenter]
            );
        `);
        
        console.log(`Missing equipments count: ${result.recordset.length}`);
        console.table(result.recordset);

    } catch (err) {
        console.error("Error executing query:", err);
    } finally {
        if (pool) pool.close();
    }
}

checkMissingEquipment();
