const { executeQuery } = require('./lib/db');

async function run() {
    try {
        const rows = await executeQuery("EXEC sp_helptext 'PMS2_New_Dash_SP_GetAnalyticalStats'");
        console.log("----- SP DEFINITION STARTS -----");
        rows.forEach(r => process.stdout.write(r.Text));
        console.log("\n----- SP DEFINITION ENDS -----");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}

run();
