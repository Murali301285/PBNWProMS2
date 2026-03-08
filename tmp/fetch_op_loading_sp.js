const fs = require('fs');

fetch('http://localhost:3001/api/dev-sp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: "EXEC sp_helptext 'PMS2_New_Sp_OperatorPerformanceLoadingReport'" })
})
    .then(r => r.json())
    .then(data => {
        if (data.count) {
            fs.writeFileSync('tmp/sp_operator_loading_report.sql', data.count.map(row => row.Text).join(''));
            console.log('Saved to tmp/sp_operator_loading_report.sql');
        } else {
            console.error('Error:', data);
        }
    })
    .catch(console.error);
