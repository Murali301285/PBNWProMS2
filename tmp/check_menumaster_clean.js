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

async function checkMenuMasterClean() {
    try {
        await sql.connect(config);

        console.log("--- Master.TblMenuMaster (Columns) ---");
        const schema = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblMenuMaster' AND TABLE_SCHEMA = 'Master'
        `);
        console.table(schema.recordset);

        console.log("\n--- Master.TblMenuMaster (Sample Data) ---");
        const menus = await sql.query(`
            SELECT TOP 5 SlNo, MenuName, MenuUrl, ParentId, IsActive 
            FROM Master.TblMenuMaster
        `);
        console.table(menus.recordset);

        console.log("\n--- Master.TblRoleAuthorization_New (Columns) ---");
        const authSchema = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblRoleAuthorization_New' AND TABLE_SCHEMA = 'Master'
        `);
        console.table(authSchema.recordset);

        console.log("\n--- Master.TblRoleAuthorization_New (Sample Data for Admin) ---");
        // Assuming RollId 1 is Admin, let's check
        const auth = await sql.query(`
            SELECT TOP 5 * 
            FROM Master.TblRoleAuthorization_New 
            WHERE RollId = 1
        `);
        console.table(auth.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkMenuMasterClean();
