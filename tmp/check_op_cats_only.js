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

async function checkOpCats() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const cats = await sql.query("SELECT * FROM Master.TblOperatorCategory");
        console.table(cats.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkOpCats();
