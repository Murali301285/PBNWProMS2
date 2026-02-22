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

async function checkMenuAndAuth() {
    try {
        await sql.connect(config);

        console.log("--- Find 'Master' Menu Parent ---");
        const parentMenu = await sql.query(`
            SELECT MenuId, Menuname, Parentid 
            FROM Master.TblMenuMaster 
            WHERE Menuname LIKE '%Master%' OR Menuname LIKE '%Configuration%'
        `);
        console.table(parentMenu.recordset);

        console.log("\n--- Master.TblRoleAuthorization_New Schema ---");
        const authSchema = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblRoleAuthorization_New' AND TABLE_SCHEMA = 'Master'
        `);
        console.table(authSchema.recordset);

        console.log("\n--- Admin Role Auth Sample ---");
        // Assuming Admin has RollId 1
        const adminAuth = await sql.query(`
            SELECT TOP 5 * 
            FROM Master.TblRoleAuthorization_New 
            WHERE RollId = 1
        `);
        console.table(adminAuth.recordset);

        console.log("\n--- TblPage Schema ---");
        const pageSchema = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblPage' AND TABLE_SCHEMA = 'Master'
        `);
        console.table(pageSchema.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkMenuAndAuth();
