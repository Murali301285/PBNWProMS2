import sql from 'mssql';
import { cookies } from 'next/headers';

// Force Rebuild Trigger: 2025-12-28 19:15

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

// Cache for connection pools: { 'ProdMS_live': pool, 'ProdMS_Test': pool }
const pools = {};

export const getDbConnection = async (dbNameOverride = null) => {
    try {
        let selectedDb = dbNameOverride;

        if (!selectedDb) {
            const cookieStore = await cookies();
            selectedDb = cookieStore.get('current_db')?.value || process.env.DB_DATABASE || 'ProMS2_Serv';
            // console.log(`[DB COOKIE] Name: ${selectedDb} (Source: ${cookieStore.get('current_db') ? 'Cookie' : 'Env/Default'})`);
        }

        // Clean db name to prevent SQL injection or path traversal (alphanumeric + underscore + dot only)
        const safeDbName = selectedDb.replace(/[^a-zA-Z0-9_.]/g, '');

        if (pools[safeDbName] && pools[safeDbName].connected) {
            return pools[safeDbName];
        }

        const config = {
            ...getBaseConfig(),
            database: safeDbName,
        };

        console.log(`------------------------------------------------`);
        console.log(`[DB DEBUG] Attempting Connection...`);
        console.log(`[DB DEBUG] Config Server: '${config.server}'`);
        console.log(`[DB DEBUG] Config Port: '${config.port}'`);
        console.log(`[DB DEBUG] Config Database: '${config.database}'`);
        console.log(`[DB DEBUG] Config User: '${config.user}'`);
        // console.log(`[DB DEBUG] Config Password: '${config.password}'`); // UNCOMMENT IF DESPERATE
        console.log(`------------------------------------------------`);

        const pool = await new sql.ConnectionPool(config).connect();
        pools[safeDbName] = pool;

        console.log(`[DB SUCCESS] Connected to ${safeDbName}`);
        return pool;
    } catch (err) {
        console.error('------------------------------------------------');
        console.error('[DB FATAL ERROR] Connection Failed!');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        console.error('Original Error:', err.originalError?.message);
        console.error('------------------------------------------------');
        throw err;
    }
};

export const executeQuery = async (query, params = [], dbName = null) => {
    try {
        const pool = await getDbConnection(dbName);
        const request = pool.request();

        if (Array.isArray(params)) {
            params.forEach(param => {
                if (param.type) {
                    const type = typeof param.type === 'string' ? sql[param.type] : param.type;
                    request.input(param.name, type, param.value);
                } else {
                    request.input(param.name, param.value);
                }
            });
        } else if (params && typeof params === 'object') {
            Object.keys(params).forEach(key => {
                request.input(key, params[key]);
            });
        }

        const result = await request.query(query);
        return result.recordset;
    } catch (error) {
        console.error('Query Execution Error:', error);
        throw error;
    }
};

export const executeStoredProcedure = async (procedureName, params = [], dbName = null) => {
    try {
        const pool = await getDbConnection(dbName);
        const request = pool.request();

        if (Array.isArray(params)) {
            params.forEach(param => {
                if (param.type) {
                    const type = typeof param.type === 'string' ? sql[param.type] : param.type;
                    request.input(param.name, type, param.value);
                } else {
                    request.input(param.name, param.value);
                }
            });
        }

        const result = await request.execute(procedureName);
        return result.recordsets; // Return all result sets
    } catch (error) {
        console.error('SP Execution Error:', error);
        throw error;
    }
};

export { sql };
