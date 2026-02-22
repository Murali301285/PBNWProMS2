const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function dropCol() {
    try {
        const pool = await sql.connect(config);

        // Find default constraint
        const getConstraint = `
            SELECT d.name
            FROM sys.default_constraints d
            INNER JOIN sys.columns c ON d.parent_object_id = c.object_id AND d.parent_column_id = c.column_id
            WHERE d.parent_object_id = OBJECT_ID('Master.TblLocation') AND c.name = 'IsDestination'
        `;
        const res = await pool.request().query(getConstraint);
        if (res.recordset.length > 0) {
            const constraintName = res.recordset[0].name;
            await pool.request().query(`ALTER TABLE Master.TblLocation DROP CONSTRAINT ${constraintName}`);
            console.log(`Dropped constraint: ${constraintName}`);
        }

        await pool.request().query("ALTER TABLE Master.TblLocation DROP COLUMN IsDestination");
        console.log("Dropped IsDestination column.");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

dropCol();
