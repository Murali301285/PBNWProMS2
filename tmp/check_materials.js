const sql = require('mssql/msnodesqlv8');

const dbConfig = {
    driver: 'msnodesqlv8',
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=(localdb)\\ProjectModels;Database=ProMS_Dev;Trusted_Connection=yes;',
};

async function run() {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`SELECT SlNo, MaterialName FROM [Master].TblMaterial WHERE SlNo IN (1, 8)`);
        console.table(result.recordset);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        sql.close();
    }
}

run();
