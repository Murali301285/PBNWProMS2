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

async function checkConstraints() {
    let pool;
    try {
        pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT 
                tc.CONSTRAINT_NAME, 
                tc.CONSTRAINT_TYPE 
            FROM 
                INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
                JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu 
                ON tc.CONSTRAINT_NAME = ccu.Constraint_Name 
            WHERE 
                tc.TABLE_NAME = 'TblEquipment' 
                AND ccu.COLUMN_NAME = 'CostCenter';
        `);
        console.dir(result.recordset);

        const indexResult = await pool.request().query(`
            SELECT 
                i.name AS IndexName, 
                i.is_unique,
                i.is_unique_constraint
            FROM sys.indexes i
            INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            INNER JOIN sys.tables t ON i.object_id = t.object_id
            WHERE t.name = 'TblEquipment' AND c.name = 'CostCenter';
        `);
        console.dir(indexResult.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        if (pool) pool.close();
    }
}

checkConstraints();
