const { sql, connectDB } = require(process.cwd() + '/lib/db');
async function run() {
    try {
        await connectDB();
        const result = await sql.query("SELECT SPECIFIC_SCHEMA, ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_NAME LIKE '%Breakdown%'");
        console.log("Found SPs: ", result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
