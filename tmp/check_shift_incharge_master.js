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

async function checkShiftInchargeMaster() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        console.log("\n--- Master.TblShiftIncharge ---");
        const schema = await sql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'Master' AND TABLE_NAME = 'TblShiftIncharge'
        `);
        console.table(schema.recordset);

        console.log("\n--- Master.TblShiftIncharge Data ---");
        const data = await sql.query("SELECT * FROM Master.TblShiftIncharge");
        console.table(data.recordset);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

checkShiftInchargeMaster();
