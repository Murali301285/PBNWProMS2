const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function findRelationships() {
    try {
        const pool = await sql.connect(config);

        // Query 1: Find Explicit Foreign Keys pointing to Master.TblLocation
        const fkQuery = `
            SELECT 
                OBJECT_SCHEMA_NAME(fk.parent_object_id) + '.' + OBJECT_NAME(fk.parent_object_id) AS ReferencingTable,
                c1.name AS ReferencingColumn,
                OBJECT_SCHEMA_NAME(fk.referenced_object_id) + '.' + OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
                c2.name AS ReferencedColumn
            FROM sys.foreign_keys fk
            INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
            INNER JOIN sys.columns c1 ON fkc.parent_object_id = c1.object_id AND fkc.parent_column_id = c1.column_id
            INNER JOIN sys.columns c2 ON fkc.referenced_object_id = c2.object_id AND fkc.referenced_column_id = c2.column_id
            WHERE OBJECT_NAME(fk.referenced_object_id) = 'TblLocation' AND OBJECT_SCHEMA_NAME(fk.referenced_object_id) = 'Master';
        `;

        console.log("--- EXPLICIT FOREIGN KEYS ---");
        const fkResult = await pool.request().query(fkQuery);
        console.table(fkResult.recordset);

        // Query 2: Find any table that has a column named "LocationId" (Implicit relationships)
        const colQuery = `
            SELECT 
                TABLE_SCHEMA + '.' + TABLE_NAME AS TableName, 
                COLUMN_NAME AS ColumnName
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE COLUMN_NAME LIKE '%LocationId%' OR COLUMN_NAME = 'Location_Id'
        `;

        console.log("\n--- IMPLICIT RELATIONSHIPS (Columns named like LocationId) ---");
        const colResult = await pool.request().query(colQuery);
        console.table(colResult.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

findRelationships();
