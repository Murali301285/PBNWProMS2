const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2026',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function testConnection() {
    try {
        console.log('Attempting connection to:', config.server);
        console.log('Database:', config.database);
        console.log('User:', config.user);
        await sql.connect(config);
        console.log('✅ Connection Successful!');
        
        // Let's also query if the SP exists
        const result = await sql.query`SELECT OBJECT_DEFINITION(OBJECT_ID('PMS2_New_Sp_DailyProductionReport')) AS SpDefinition`;
        if (result.recordset.length > 0 && result.recordset[0].SpDefinition) {
            console.log('✅ Stored Procedure found!');
        } else {
            console.log('❌ Stored Procedure NOT found in this database!');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        console.error('Error Code:', err.code);
        process.exit(1);
    }
}

testConnection();
