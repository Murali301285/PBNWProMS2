
const sql = require('mssql');

const DEFAULT_DB = process.env.DB_DATABASE || 'ProMS2_Serv';

const getBaseConfig = () => ({
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    connectionTimeout: 300000,
    requestTimeout: 300000,
});

const getDbConnection = async (dbNameOverride = null) => {
    try {
        const selectedDb = dbNameOverride || DEFAULT_DB;
        const config = {
            ...getBaseConfig(),
            database: selectedDb,
        };

        const pool = await new sql.ConnectionPool(config).connect();
        return pool;
    } catch (err) {
        console.error('DB Connection Failed:', err);
        throw err;
    }
};

module.exports = { sql, getDbConnection };
