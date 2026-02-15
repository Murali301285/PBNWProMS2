
const sql = require('mssql');

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
    connectionTimeout: 30000,
    requestTimeout: 30000,
};

async function debugQuery() {
    try {
        console.log(`Connecting to database: ${config.database} on ${config.server}`);
        const pool = await new sql.ConnectionPool(config).connect();

        const dateInput = '2025-12-30';
        const shiftId = 3;

        console.log(`--- Executing Query with Date: ${dateInput}, ShiftId: ${shiftId} ---`);

        const crusherQuery = `
            SELECT 
                c.SlNo,
                p.PlantName as EquipmentName,
                c.RunningHr,
                c.TotalQty,
                0 as Budget,
                c.TotalQty as Actual
            FROM Trans.TblCrusher c
            LEFT JOIN Master.TblPlant p ON c.PlantId = p.PlantId
            WHERE c.Date = @Date AND c.ShiftId = @ShiftId
        `;

        const res = await pool.request()
            .input('Date', sql.Date, dateInput) // Try sql.Date first
            .input('ShiftId', sql.Int, shiftId)
            .query(crusherQuery);

        console.log("Result using sql.Date:");
        console.log(res.recordset);

        // Also try literal string in query to debug
        const crusherQueryLiteral = `
            SELECT TOP 5 * FROM Trans.TblCrusher c WHERE c.Date = '${dateInput}' AND c.ShiftId = ${shiftId}
        `;
        const resLit = await pool.request().query(crusherQueryLiteral);
        console.log("Result using Literal String:");
        console.log(resLit.recordset);

        await pool.close();

    } catch (error) {
        console.error('Error executing query:', error);
    }
}

debugQuery();
