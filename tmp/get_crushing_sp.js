const sql = require('mssql');

const config = {
    user: 'sa', // Adjust if needed
    password: 'sa', // Adjust if needed
    server: '143.110.190.22', // Adjust if needed
    database: 'ProdMS_live', // Adjust if needed
    options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: 'SQLEXPRESS'
    }
};

async function getSP() {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('ObjName', sql.NVarChar, 'PMS2_New_Dash_SP_Crushing_ProductionOverview')
            .query('EXEC sp_helptext @ObjName');
        console.log(result.recordset.map(r => r.Text).join(''));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        sql.close();
    }
}

getSP();
