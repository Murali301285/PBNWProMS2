
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkDuplicates() {
    try {
        await sql.connect(config);

        console.log("Checking for duplicates in TblRoleAuthorization_New...");
        const authDuplicates = await sql.query(`
            SELECT RoleId, PageId, Count(*) as Count
            FROM [Master].[TblRoleAuthorization_New]
            WHERE IsActive = 1 AND IsDeleted = 0
            GROUP BY RoleId, PageId
            HAVING Count(*) > 1
        `);

        if (authDuplicates.recordset.length > 0) {
            console.log("Found Duplicates in TblRoleAuthorization_New:", authDuplicates.recordset);
        } else {
            console.log("No duplicates found in TblRoleAuthorization_New.");
        }

        console.log("Checking for duplicates in TblMenuAllocation...");
        const menuDuplicates = await sql.query(`
            SELECT PageId, ModuleId, Count(*) as Count
            FROM [Master].[TblMenuAllocation]
            WHERE IsActive = 1 AND IsDelete = 0
            GROUP BY PageId, ModuleId
            HAVING Count(*) > 1
        `);

        if (menuDuplicates.recordset.length > 0) {
            console.log("Found Duplicates in TblMenuAllocation:", menuDuplicates.recordset);
        } else {
            console.log("No duplicates found in TblMenuAllocation.");
        }

        await sql.close();

    } catch (error) {
        console.error("Error:", error);
    }
}

checkDuplicates();
