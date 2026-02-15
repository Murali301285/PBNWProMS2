
const http = require('http');

const data = JSON.stringify({
    date: '2025-12-30', // Crusher data exists this date
    shiftId: 3 // Crusher data exists this shift
});

const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/reports/shift-production',
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
            if (json.success) {
                console.log("Crushing Details:", json.data.crushingDetails);
                console.log("Dewatering Details:", json.data.dewateringDetails);
            } else {
                console.log("Error:", json.message);
            }
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
