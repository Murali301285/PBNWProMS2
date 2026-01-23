
import sql from 'mssql';

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Chennai@42',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
};

async function checkIntegrity() {
    try {
        console.log("Connecting...");
        const pool = await sql.connect(config);

        console.log("\n--- Latest Equipment Reading ---");
        const res = await pool.request().query("SELECT TOP 1 SlNo, [Date], ShiftInchargeId, MidScaleInchargeId, OperatorId FROM [Trans].[TblEquipmentReading] ORDER BY SlNo DESC");

        if (res.recordset.length === 0) {
            console.log("No Transactions Found.");
            return;
        }

        const trans = res.recordset[0];
        console.table([trans]);

        const checkOp = async (label, id) => {
            if (!id) {
                console.log(`${label}: NULL`);
                return;
            }
            const opRes = await pool.request().query(`SELECT SlNo, OperatorName, IsActive, IsDelete FROM [Master].[TblOperator] WHERE SlNo = ${id}`);
            if (opRes.recordset.length > 0) {
                console.log(`${label} (ID ${id}): FOUND - ${opRes.recordset[0].OperatorName}`);
            } else {
                console.log(`${label} (ID ${id}): ❌ NOT FOUND in TblOperator!`);
            }
        };

        await checkOp('Shift Incharge', trans.ShiftInchargeId);
        await checkOp('MidScale Incharge', trans.MidScaleInchargeId);
        await checkOp('Main Operator', trans.OperatorId);

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        process.exit();
    }
}

checkIntegrity();
