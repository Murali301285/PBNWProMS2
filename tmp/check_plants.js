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

async function checkPlants() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const result = await sql.query(`
            SELECT SlNo, Name 
            FROM Master.TblPlant 
            WHERE Name IN ('PSS 1', 'PSS 2', 'PSS 3', 'IPCC', 'WP-3', 'WP 3')
        `);
        console.table(result.recordset);

        // Also list all plants just in case of typos
        const all = await sql.query("SELECT SlNo, Name FROM Master.TblPlant");
        console.table(all.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkPlants();
