const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

async function getSp() {
    try {
        const pool = await sql.connect(process.env.DATABASE_URL);
        const result = await pool.request().query("EXEC sp_helptext 'PMS2_New_Sp_MaterialLoadingReport'");
        let spText = result.recordset.map(row => row.Text).join('');
        const fs = require('fs');
        fs.writeFileSync('tmp/sp_material_loading_report.sql', spText);
        console.log("SP saved to tmp/sp_material_loading_report.sql");
        sql.close();
    } catch (err) {
        console.error(err);
    }
}
getSp();
