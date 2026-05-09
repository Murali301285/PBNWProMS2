const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

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

async function checkMenus() {
    let pool;
    try {
        pool = await sql.connect(config);
        
        const query = `
            SELECT 
                MA.SlNo as AllocationId,
                M.ModuleName,
                SG.SubGroupName,
                P.PageName,
                P.SlNo as PageId,
                MA.SortOrder
            FROM [Master].[TblMenuAllocation] MA
            JOIN [Master].[TblModule] M ON MA.ModuleId = M.SlNo
            LEFT JOIN [Master].[TblSubGroup] SG ON MA.SubGroupId = SG.SlNo
            JOIN [Master].[TblPage] P ON MA.PageId = P.SlNo
            WHERE MA.IsActive = 1 AND MA.IsDelete = 0 AND P.IsActive = 1 AND P.IsDelete = 0
            AND M.ModuleName LIKE '%Dashboard%' 
            AND (P.PageName LIKE '%crush%' OR P.PageName LIKE '%Blasting%')
            ORDER BY M.SortOrder, SG.SortOrder, MA.SortOrder, P.PageName ASC
        `;
        
        const result = await pool.request().query(query);
        console.table(result.recordset);
    } catch (err) {
        console.error("Error executing query:", err);
    } finally {
        if (pool) pool.close();
    }
}

checkMenus();
