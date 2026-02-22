
const mssql = require('mssql');

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

async function checkSource() {
    try {
        await mssql.connect(config);
        const res = await mssql.query`SELECT TOP 1 * FROM Master.TblSource`;
        console.log("Source Data:", res.recordset[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkSource();
