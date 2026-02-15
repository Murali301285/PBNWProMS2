
const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_Serv',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
};

const sql = require('mssql');

async function checkEquipment() {
    try {
        const pool = await new sql.ConnectionPool(config).connect();

        console.log("--- Checking Equipment 664, 665, 666, 667 ---");
        const query = `
            SELECT SlNo, EquipmentName, EquipmentGroupId, ScaleId 
            FROM Master.TblEquipment 
            WHERE SlNo IN (664, 665, 666, 667)
        `;
        const result = await pool.request().query(query);
        console.table(result.recordset);

        await pool.close();
    } catch (e) {
        console.error(e);
    }
}
checkEquipment();
