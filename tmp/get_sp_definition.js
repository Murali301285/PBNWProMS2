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

async function getSpDefinition() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const result = await sql.query(`
            SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.PMS2_New_Dash_SP_CrushingDashboard')) AS SpText
        `);

        if (result.recordset.length > 0) {
            console.log(result.recordset[0].SpText);
        } else {
            console.log("SP not found.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await sql.close();
    }
}

getSpDefinition();
