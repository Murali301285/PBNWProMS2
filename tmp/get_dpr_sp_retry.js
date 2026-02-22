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

async function getSP() {
    try {
        await sql.connect(config);
        const result = await sql.query(`EXEC sp_helptext 'PMS2_New_Sp_DailyProgressReport'`);
        console.log(result.recordset.map(row => row.Text).join(''));
    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

getSP();
