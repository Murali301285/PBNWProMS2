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

async function checkMenuMaster() {
    try {
        await sql.connect(config);

        console.log("--- Master.TblMenuMaster (First 5) ---");
        const menus = await sql.query("SELECT TOP 5 * FROM Master.TblMenuMaster");
        console.table(menus.recordset);

        console.log("\n--- Master.TblPage (First 5) ---");
        const pages = await sql.query("SELECT TOP 5 * FROM Master.TblPage");
        // console.table(pages.recordset); // Already checked

        console.log("\n--- Master.TblRoleAuthorization_New (First 5) ---");
        const auth = await sql.query("SELECT TOP 5 * FROM Master.TblRoleAuthorization_New");
        console.table(auth.recordset);

        // Find the 'Configuration' menu to get its ID
        console.log("\n--- Configuration Menu ID ---");
        const configMenu = await sql.query(`
            SELECT * FROM Master.TblMenuMaster 
            WHERE MenuName LIKE '%Configuration%' OR MenuName LIKE '%Master%'
        `);
        console.table(configMenu.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

checkMenuMaster();
