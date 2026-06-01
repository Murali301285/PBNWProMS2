const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    database: 'ProMS2_2026',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    port: 1433
};

async function main() {
    try {
        const pool = await sql.connect(config);
        console.log("Connected to DB!");

        const tables = ['[Master].[TblQtyTripMapping]', '[Master].[TblMaterial]', '[Master].[TblEquipmentGroup]', '[Master].[TblEquipment]'];
        for (const table of tables) {
            console.log(`\n--- Columns of ${table} ---`);
            const cleanTable = table.replace(/\[|\]/g, '').split('.');
            const schema = cleanTable[0];
            const name = cleanTable[1];
            const result = await pool.request()
                .input('schema', schema)
                .input('name', name)
                .query(`
                    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = @name
                    ORDER BY ORDINAL_POSITION
                `);
            console.log(result.recordset.map(c => `${c.COLUMN_NAME} (${c.DATA_TYPE}${c.CHARACTER_MAXIMUM_LENGTH ? ',' + c.CHARACTER_MAXIMUM_LENGTH : ''}) - Nullable: ${c.IS_NULLABLE}`).join('\n'));
        }

        console.log('\n--- Active Materials ---');
        const activeMats = await pool.request().query('SELECT SlNo, MaterialName, IsActive, IsDelete FROM [Master].[TblMaterial] WHERE IsDelete = 0');
        console.log(activeMats.recordset);

        console.log('\n--- QtyTripMapping Sample Rows ---');
        const sampleRows = await pool.request().query('SELECT TOP 5 * FROM [Master].[TblQtyTripMapping]');
        console.log(sampleRows.recordset);

        await pool.close();
    } catch (err) {
        console.error(err);
    }
}

main();
