
const mssql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_Serv',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function renameSp() {
    try {
        await mssql.connect(config);

        // check if target already exists to avoid conflict
        try {
            await mssql.query("DROP PROCEDURE [dbo].[PMS2_New_Sp_OperatorPerformanceLoadingReport]");
            console.log("Dropped existing target SP if any.");
        } catch (e) {
            // ignore if not exists
        }

        await mssql.query("exec sp_rename 'PMS2_New_Sp_OperatorPerformanceReport', 'PMS2_New_Sp_OperatorPerformanceLoadingReport'");
        console.log("Renamed SP successfully.");

    } catch (err) {
        console.error("Error renaming SP:", err);
    } finally {
        process.exit();
    }
}

renameSp();
