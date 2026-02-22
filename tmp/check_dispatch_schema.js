const sql = require('mssql');

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

async function checkDispatchSchema() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const tables = ['TblShiftDispatch', 'TblShiftDispatchDetails'];

        for (const tbl of tables) {
            console.log(`\n--- Schema for Trans.${tbl} ---`);
            const schema = await sql.query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME = '${tbl}'
            `);
            console.table(schema.recordset);
        }

        // Also check if there is a TblShiftIncharge
        const otherTables = await sql.query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME LIKE '%Incharge%'
        `);
        if (otherTables.recordset.length > 0) {
            console.log("\n--- Other Incharge Tables ---");
            console.table(otherTables.recordset);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkDispatchSchema();
