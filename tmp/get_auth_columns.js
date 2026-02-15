
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function getColumns() {
    try {
        await sql.connect(config);
        const result = await sql.query(`SELECT TOP 1 * FROM [Master].[TblRoleAuthorization_New]`);
        if (result.recordset.length > 0) {
            console.log("Columns:", Object.keys(result.recordset[0]));
        } else {
            console.log("Table is empty, cannot infer columns from data.");
            const schema = await sql.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'TblRoleAuthorization_New' AND TABLE_SCHEMA = 'Master'
            `);
            console.log("Schema Columns:", schema.recordset.map(r => r.COLUMN_NAME));
        }
        await sql.close();
    } catch (error) {
        console.error("Error:", error);
    }
}

getColumns();
