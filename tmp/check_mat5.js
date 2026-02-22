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

async function checkMat5() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Recent OB Rehandling (Mat 5) ---");
        const data = await sql.query(`
            SELECT TOP 10 * 
            FROM Trans.TblMaterialRehandling 
            WHERE MaterialId = 5
            ORDER BY RehandlingDate DESC
        `);
        console.table(data.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkMat5();
