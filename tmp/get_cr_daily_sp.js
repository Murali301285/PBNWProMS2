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

async function run() {
    try {
        await mssql.connect(config);
        const result = await mssql.query("EXEC sp_helptext 'ProMS2_SPReportCrDailyShift'");
        let fullText = '';
        result.recordset.forEach(r => {
            fullText += r.Text;
        });
        console.log(fullText);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
run();
