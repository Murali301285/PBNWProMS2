const sql = require('mssql');
const fs = require('fs');
const path = require('path');

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

async function executeSql() {
    try {
        await sql.connect(config);
        console.log("Connected to DB");

        const sqlFilePath = path.join(__dirname, '../Data/PMS2_New_Dash_SP_Crushing_ProductionOverview.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Remove 'GO' if present (simple split might not be robust for all T-SQL but works for simple scripts)
        const commands = sqlContent.split(/\bGO\b/i);

        for (const command of commands) {
            if (command.trim()) {
                await sql.query(command);
                console.log("Executed SQL command successfully.");
            }
        }

    } catch (err) {
        console.error("Error executing SQL:", err);
    } finally {
        await sql.close();
    }
}

executeSql();
