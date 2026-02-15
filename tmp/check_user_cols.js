
const { executeQuery } = require('../lib/db');

async function checkCols() {
    try {
        const query = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TblUser_New' AND TABLE_SCHEMA = 'Master'";
        const res = await executeQuery(query);
        console.log(JSON.stringify(res));
    } catch (err) {
        console.error(err);
    }
}

checkCols();
