const sql = require('mssql');

const dbConfig = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_PBNW',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkMaterials() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(dbConfig);
        console.log('Fetching materials...');
        const res = await pool.request().query('SELECT SlNo, MaterialName FROM [Master].[TblMaterial]');
        console.log('====================================================');
        console.log('MATERIALS IN DATABASE:');
        console.log('====================================================');
        console.table(res.recordset);
        console.log('====================================================');
        process.exit(0);
    } catch (e) {
        console.error('Error querying materials:', e);
        process.exit(1);
    }
}

checkMaterials();
