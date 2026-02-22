const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Chennai@42',
    server: 'localhost',
    port: 1433,
    database: 'ProMS2_2102',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
    }
};

async function testPostLogic() {
    try {
        console.log("Mock request for Body = { LocationType: 'Test', Remarks: 'ok', IsActive: 1 }");
        const body = { LocationType: 'Test', Remarks: 'ok', IsActive: 1 };

        let configCols = [
            { accessor: 'LocationType' },
            { accessor: 'Remarks' },
            { accessor: 'IsActive' }
        ];

        let reqDict = {};
        configCols.forEach(col => {
            if (body[col.accessor] !== undefined) {
                reqDict[col.accessor] = body[col.accessor];
            }
        });

        console.log("Extracted: ", reqDict);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

testPostLogic();
