require('dotenv').config({ path: '.env.local' });
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || '127.0.0.1',
    database: process.env.DB_DATABASE || 'ProMS2_1203',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

async function main() {
    try {
        await sql.connect(config);
        const result = await sql.query(`SELECT OBJECT_DEFINITION(OBJECT_ID('PMS2_New_Dash_SP_GetAnalyticalStats')) AS sp_definition;`);
        require('fs').writeFileSync('tmp/sp_dash_analytical.sql', result.recordset[0].sp_definition);
        console.log("Saved to tmp/sp_dash_analytical.sql");
    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
}
main();
