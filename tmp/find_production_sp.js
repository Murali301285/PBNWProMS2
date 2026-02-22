
const mssql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_1602',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function getSPName() {
    try {
        await mssql.connect(config);
        const result = await mssql.query`
            SELECT name 
            FROM sys.procedures
            WHERE name LIKE '%Production%' AND name LIKE '%Tsmpl%'
        `;
        if (result.recordset.length > 0) {
            console.log("Found SPs:", result.recordset);
        } else {
            console.log("No SP found matching pattern.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

getSPName();
