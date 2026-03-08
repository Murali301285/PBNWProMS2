const { getDbConnection } = require('./lib/db');

async function getSP() {
    const pool = await getDbConnection();
    const res = await pool.request().query("EXEC sp_helptext 'PMS2_New_Dash_SP_Performance_CoalOBProduction'");

    let formattedSql = '';
    res.recordset.forEach(row => {
        formattedSql += row.Text;
    });
    console.log(formattedSql);
    process.exit(0);
}
getSP();
