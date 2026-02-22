const http = require('http');

const data = JSON.stringify({
    LocationType: "Test Location",
    Remarks: "Testing API",
    IsActive: true
});

const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/master/location-type',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${body}`);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
