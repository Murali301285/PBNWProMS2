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

async function debugFuelApi() {
    try {
        await sql.connect(config);

        console.log("--- Executing API Query Logic ---");
        const query = `
            SELECT SlNo as id, * 
            FROM [Master].[TblFuelType] 
            WHERE IsDelete = 0 
            ORDER BY SlNo DESC
        `;
        console.log("Query:", query);

        const result = await sql.query(query);
        console.log(`Rows found: ${result.recordset.length}`);
        console.table(result.recordset);

    } catch (err) {
        console.error("Error executing query:", err);
    } finally {
        await sql.close();
    }
}

debugFuelApi();
