const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const sql = require('mssql');
const fs = require('fs');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: true,
    },
};

async function getSp() {
    let pool;
    try {
        pool = await sql.connect(config);
        const query = `EXEC sp_helptext 'PMS2_New_Sp_MaterialLoadingReport'`;
        const result = await pool.request().query(query);
        const text = result.recordset.map(r => r.Text).join('');
        fs.writeFileSync('tmp/current_sp.sql', text);
        console.log("SP Saved to tmp/current_sp.sql");
    } catch (err) {
        console.error("Error executing query:", err);
    } finally {
        if (pool) pool.close();
    }
}

getSp();
