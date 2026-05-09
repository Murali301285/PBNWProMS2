const sql = require('mssql');
const fs = require('fs');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    database: 'ProMS2_2026',
    options: { encrypt: false, trustServerCertificate: true }
};

const files = [
    'tmp/PMS2_New_Sp_MaterialRehandlingReport.sql',
    'tmp/PMS2_New_Sp_HaulingMasterReport.sql',
    'tmp/PMS2_New_Sp_LoadingMasterReport.sql'
];

async function run() {
    try {
        await sql.connect(config);
        for (let file of files) {
            const query = fs.readFileSync(file, 'utf8');
            try {
                await sql.query(query);
                console.log("Successfully altered from", file);
            } catch (err) {
                console.error("Failed to alter from", file, err.message);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error("Connection failed:", e);
        process.exit(1);
    }
}
run();
