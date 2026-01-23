
import { executeQuery, getDbConnection } from '../lib/db.js';

// Skipping dotenv, assume env var or hardcoded

async function testConnection() {
    try {
        console.log("Testing connection to ProMS2_Serv...");
        // API login route uses process.env.DB_DATABASE. Let's see what it resolves to.
        console.log("Env DB:", process.env.DB_DATABASE);

        const pool = await getDbConnection('ProMS2_Serv');
        console.log("Connection successful!");

        console.log("Querying [Master].[TblUser_New]...");
        const result = await pool.request().query("SELECT TOP 1 * FROM [Master].[TblUser_New]");
        console.log("Query successful! Found user:", result.recordset[0]?.UserName);

    } catch (error) {
        console.error("CONNECTION FAILED:", error);
        console.error("Error Code:", error.code);
        console.error("Error Name:", error.name);
    } finally {
        process.exit();
    }
}

testConnection();
