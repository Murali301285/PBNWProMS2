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
            SELECT OBJECT_DEFINITION(OBJECT_ID('dbo.PMS2_New_Sp_EquipmentPerformanceReport')) AS SpText
        `);

        if (result.recordset.length > 0) {
            const fs = require('fs');
            fs.writeFileSync('tmp/sp_content.sql', result.recordset[0].SpText);
            console.log("SP definition written to tmp/sp_content.sql");
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
