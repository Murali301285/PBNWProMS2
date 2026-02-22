
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

async function checkMetadata() {
    try {
        await mssql.connect(config);

        // Check Dispatch Table
        const dispatchTables = await mssql.query`
            SELECT TABLE_SCHEMA, TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'Trans' AND TABLE_NAME LIKE '%Dispatch%'
        `;
        console.log("Dispatch Tables:", dispatchTables.recordset);

        // Check Material Types (Coal, OB)
        const materials = await mssql.query`SELECT SlNo, MaterialName FROM Master.TblMaterial`;
        console.log("Materials:", materials.recordset);

        // Check Equipment Groups (for Electrical Shovel)
        const groups = await mssql.query`SELECT SlNo, EquipmentGroupName FROM Master.TblEquipmentGroup`;
        console.log("Equipment Groups:", groups.recordset);

        // Check columns of DispatchEntry if exists
        const dispatchEntry = dispatchTables.recordset.find(t => t.TABLE_NAME === 'TblDispatchEntry');
        if (dispatchEntry) {
            const res = await mssql.query`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'TblDispatchEntry' AND TABLE_SCHEMA = 'Trans'
            `;
            console.log("\nColumns for Trans.TblDispatchEntry:");
            console.table(res.recordset.map(c => ({ name: c.COLUMN_NAME, type: c.DATA_TYPE })));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mssql.close();
    }
}

checkMetadata();
