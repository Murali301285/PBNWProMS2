const fs = require('fs');
const sql = require('mssql');
const env = fs.readFileSync('.env.local', 'utf8');
const dbUrl = env.split('\n').find(l => l.startsWith('DATABASE_URL')).split('=')[1].trim();

async function getSp() {
    try {
        const pool = await sql.connect(dbUrl);
        const result = await pool.request().query("EXEC sp_helptext 'PMS2_New_Sp_MaterialLoadingReport'");
        let spText = result.recordset.map(row => row.Text).join('');
        fs.writeFileSync('tmp/sp_material_loading_report.sql', spText, 'utf8');
        console.log("SP saved to tmp/sp_material_loading_report.sql");
        sql.close();
    } catch (err) {
        console.error(err);
    }
}
getSp();
