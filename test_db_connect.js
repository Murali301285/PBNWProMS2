const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'MURALI\\SQLEXPRESS', // Double backslash for JS string
    database: 'ProdMS_live',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function testConnection() {
    try {
        console.log('Attempting connection to:', config.server);
        console.log('User:', config.user);
        await sql.connect(config);
        console.log('✅ Connection Successful!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        console.error('Error Code:', err.code);
        process.exit(1);
    }
}

testConnection();
