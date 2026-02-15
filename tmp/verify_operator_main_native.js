
const http = require('http');

const data = JSON.stringify({
    date: '2026-02-14',
    operatorIds: []
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/reports/operator-performance-loading',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    console.log(`STATUS: ${res.statusCode}`);

    let responseData = '';

    res.on('data', d => {
        responseData += d;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(responseData);
            console.log("Report Data Length:", Array.isArray(json) ? json.length : 'Not Array');
            if (Array.isArray(json) && json.length > 0) {
                console.log("Sample Row:", json[0]);
            } else {
                console.log("Report is empty or error:", json);
            }
        } catch (e) {
            console.log("Response not JSON:", responseData.substring(0, 100));
        }
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
