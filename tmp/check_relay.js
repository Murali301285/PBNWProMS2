
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

async function checkRelay() {
    try {
        await mssql.connect(config);
        const res = await mssql.query`SELECT TOP 1 Name FROM Master.TblRelay`;
        console.log("Relay Name:", res.recordset[0]?.Name);
    } catch (err) {
        console.error(err.message);
    } finally {
        await mssql.close();
    }
}

checkRelay();
