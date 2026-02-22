const fs = require('fs');
const { sql, connectDB } = require(process.cwd() + '/lib/db');

async function run() {
    try {
        await connectDB();
        console.log("Connected. Reading SQL file...");

        let script = fs.readFileSync('tmp/create_sp_breakdown_analysis.sql', 'utf8');

        // Remove GO statements as tedious in mssql package
        const batches = script.split(/^\s*GO\s*$/im).filter(b => b.trim());

        for (let batch of batches) {
            console.log("Executing batch...");
            await sql.query(batch);
        }

        console.log("Successfully created Breakdown SP!");
        process.exit(0);
    } catch (err) {
        console.error("SQL Error: ", err);
        process.exit(1);
    }
}
run();
