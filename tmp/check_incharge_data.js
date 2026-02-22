
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

async function checkData() {
    try {
        await mssql.connect(config);

        // Get sample Loading data with Incharge IDs
        const loading = await mssql.query`
            SELECT TOP 5 ShiftInchargeId, MidScaleInchargeId 
            FROM Trans.TblLoading 
            WHERE IsDelete = 0 AND (ShiftInchargeId IS NOT NULL OR MidScaleInchargeId IS NOT NULL)
        `;
        console.log("Sample Loading Data:", loading.recordset);

        if (loading.recordset.length > 0) {
            const id = loading.recordset[0].ShiftInchargeId || loading.recordset[0].MidScaleInchargeId;
            if (id) {
                // Check if this ID exists in User table
                const user = await mssql.query`SELECT SlNo, EmpName FROM Master.TblUser_New WHERE SlNo = ${id}`;
                console.log("User Match:", user.recordset);

                // Check in Employee table if User match fails or just to be sure
                const emp = await mssql.query`SELECT SlNo, EmpName FROM Master.TblEmployee WHERE SlNo = ${id}`;
                console.log("Employee Match:", emp.recordset);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkData();
