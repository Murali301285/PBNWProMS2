
const http = require('http');

const date = '2025-12-30';
const shiftId = 3; // Using known shift from previous tasks

function callApi(params, label) {
    const data = JSON.stringify(params);
    const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/api/reports/sector-wise-production',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, res => {
        let responseData = '';
        res.on('data', d => responseData += d);
        res.on('end', () => {
            try {
                const json = JSON.parse(responseData);
                if (json.success) {
                    console.log(`${label}: Found ${json.data.length} records.`);
                    if (json.data.length > 0) {
                        console.log(`${label} First Record:`, json.data[0]);
                    }
                } else {
                    console.log(`${label} Error:`, json.message);
                }
            } catch (e) {
                console.error("Error parsing JSON:", e);
            }
        });
    });

    req.on('error', error => console.error(error));
    req.write(data);
    req.end();
}

console.log(`--- Testing Sector Wise Report for ${date} ---`);
callApi({ date }, "Without Shift");
callApi({ date, shiftId }, `With Shift ${shiftId}`);
