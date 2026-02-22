
const mssql = require('mssql');

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

async function checkUserColumns() {
    try {
        await mssql.connect(config);

        const res = await mssql.query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'TblShiftInchargeUser' AND TABLE_SCHEMA = 'Master'
        `);
        console.log("Columns for Master.TblShiftInchargeUser:");
        console.table(res.recordset);

        // Also check if there is a 'Scale' or similar in TblUser/Employee
        const users = await mssql.query(`
            SELECT TOP 5 * FROM Master.TblUser_New
        `);
        // If TblUser_New doesn't exist, try TblUser
        // But history said TblUser_New
        console.log("Sample User Data:");
        console.log(users.recordset);

    } catch (err) {
        console.error(err);
        // Fallback search for User table
    } finally {
        await mssql.close();
    }
}

checkUserColumns();
