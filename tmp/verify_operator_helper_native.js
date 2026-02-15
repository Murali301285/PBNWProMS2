
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/reports/operator-performance-loading/helpers',
    method: 'GET'
};

const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);

    let data = '';

    res.on('data', d => {
        data += d;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Operators Count:", json.operators ? json.operators.length : 0);
            if (json.operators && json.operators.length > 0) {
                console.log("Sample:", json.operators[0]);
            }
        } catch (e) {
            console.log("Response not JSON:", data.substring(0, 100));
        }
    });
});

req.on('error', error => {
    console.error(error);
});

req.end();
