
const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function testQuery() {
    try {
        await sql.connect(config);

        console.log("Running Query...");
        const result = await sql.query(`
            SELECT SlNo as id, OperatorName as name 
            FROM [Master].[TblOperator] 
            WHERE IsDelete = 0 AND IsActive = 1 
            ORDER BY OperatorName
        `);

        console.log("Query Results:", result.recordset.length);
        if (result.recordset.length > 0) {
            console.log("Sample:", result.recordset[0]);
        }

    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        process.exit();
    }
}

testQuery();
