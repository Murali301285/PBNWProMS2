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

async function checkFinalDetails() {
    try {
        await sql.connect(config);

        console.log("--- Roles ---");
        // Check for table name, could be TblRole or TblRoles
        const roles = await sql.query(`
            SELECT * FROM Master.TblRole_New
        `);
        console.table(roles.recordset);

        console.log("\n--- Page Table Sample ---");
        const pages = await sql.query(`
            SELECT TOP 5 * FROM Master.TblPage
        `);
        console.table(pages.recordset);

    } catch (err) {
        // Fallback if TblRole_New doesn't exist
        try {
            const roles = await sql.query(`SELECT * FROM Master.TblRole`);
            console.table(roles.recordset);
        } catch (e) {
            console.error(e);
        }
    } finally {
        await sql.close();
    }
}

checkFinalDetails();
