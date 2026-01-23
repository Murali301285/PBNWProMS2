
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

async function checkMasters() {
    try {
        console.log("Connecting...");
        const pool = await sql.connect(config);
        console.log("Connected.");

        const checkTable = async (name) => {
            try {
                const res = await pool.request().query(`SELECT COUNT(*) as Count FROM [Master].[${name}]`);
                console.log(`${name}: ${res.recordset[0].Count}`);
            } catch (e) {
                console.log(`${name}: ERROR - ${e.message}`);
            }
        };

        await checkTable('TblShift');
        await checkTable('TblRelay');
        await checkTable('TblActivity');
        await checkTable('TblEquipment');
        await checkTable('TblOperator');
        await checkTable('TblSector');
        await checkTable('TblPatch');
        await checkTable('TblMethod');

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        process.exit();
    }
}

checkMasters();
