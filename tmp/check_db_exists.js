
const mssql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'master', // Connect to master to check databases
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function checkDatabase() {
    try {
        await mssql.connect(config);
        const result = await mssql.query`SELECT name FROM sys.databases WHERE name = 'ProMS2_1602'`;

        if (result.recordset.length > 0) {
            console.log("Database 'ProMS2_1602' exists.");
        } else {
            console.log("Database 'ProMS2_1602' DOES NOT exist.");
        }
    } catch (err) {
        console.error("Error checking database:", err);
    } finally {
        await mssql.close();
    }
}

checkDatabase();
