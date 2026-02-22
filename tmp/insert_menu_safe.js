const sql = require('mssql');

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

async function insertMenuSafe() {
    try {
        const pool = await sql.connect(config);

        // Find Master parent ID
        const parentRes = await pool.request().query("SELECT MenuId FROM Master.TblMenuMaster WHERE Menuname = 'Master'");
        if (!parentRes.recordset || parentRes.recordset.length === 0) {
            console.error("Could not find 'Master' menu item.");
            return;
        }

        const parentId = parentRes.recordset[0].MenuId;

        // Find latest Sortby for that parent
        const sortRes = await pool.request().query('SELECT MAX(Sortby) as MaxSort FROM Master.TblMenuMaster WHERE Parentid = ' + parentId);
        const nextSort = (sortRes.recordset[0].MaxSort || 0) + 1;

        console.log('Inserting Location Type under parent ' + parentId + ' with sort order ' + nextSort + '...');

        const pagePath = '/dashboard/master/location-type';
        // Also check TblPage
        const checkPage = await pool.request().query("SELECT * FROM Master.TblPage WHERE PageName = 'Location Type'");
        if (checkPage.recordset.length === 0) {
            await pool.request().query("INSERT INTO Master.TblPage (PageName, PagePath, IsActive, IsDelete, CreatedBy, CreatedDate) VALUES ('Location Type', '" + pagePath + "', 1, 0, 'System', GETDATE())");
            console.log("Inserted Location Type into TblPage.");
        }

        const checkMenu = await pool.request().query("SELECT * FROM Master.TblMenuMaster WHERE Menuname = 'Location Type'");
        if (checkMenu.recordset.length === 0) {
            await pool.request().query("INSERT INTO Master.TblMenuMaster (Menuname, Controller, Method, Icon, Module, Url, Parentid, Ismenu, Sortby, Createdate, IsDelete, IsMobile, IsActive) VALUES ('Location Type', 'LocationType', 'LocationTypeIndex', NULL, NULL, '" + pagePath + "', " + parentId + ", 1, " + nextSort + ", GETDATE(), 0, 0, 1)");
            console.log("Inserted Location Type into TblMenuMaster.");
        } else {
            console.log("Menu already exists, skipping insertion.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

insertMenuSafe();
