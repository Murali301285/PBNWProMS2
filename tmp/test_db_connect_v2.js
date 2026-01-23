
const { executeQuery, getDbConnection } = require('../lib/db');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
    try {
        console.log("Testing connection to ProMS2_Serv...");
        // Force DB name to ensure we test the right one
        const pool = await getDbConnection('ProMS2_Serv');
        console.log("Connection successful!");

        console.log("Querying [Master].[TblUser_New]...");
        const result = await pool.request().query("SELECT TOP 1 * FROM [Master].[TblUser_New]");
        console.log("Query successful! Found user:", result.recordset[0]?.UserName);

    } catch (error) {
        console.error("CONNECTION FAILED:", error);
    } finally {
        process.exit();
    }
}

testConnection();
