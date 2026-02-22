const sql = require('mssql');
const { config } = require('../lib/db');
const fs = require('fs');

async function getSP() {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('ObjName', sql.NVarChar, 'PMS2_New_Dash_SP_Crushing_ProductionOverview')
            .query('EXEC sp_helptext @ObjName');
        const text = result.recordset.map(r => r.Text).join('');
        console.log("Successfully extracted SP.");
        fs.writeFileSync('../tmp/CrushingSP_Overview.txt', text);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        sql.close();
    }
}

getSP();
