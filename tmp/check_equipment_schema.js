// SQL Column Lookup
require('dotenv').config({ path: '.env.local' });
const { executeQuery } = require('./lib/db');

async function run() {
    try {
        console.log("Fetching columns for TblEquipment...");
        const res = await executeQuery(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblEquipment'`);
        console.log(res.map(r => r.COLUMN_NAME).join(', '));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
