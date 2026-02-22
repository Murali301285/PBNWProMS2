const http = require('http');

function fetchData(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3000${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`PATH: ${path} | STATUS: ${res.statusCode}`);
                if (res.headers['content-type']?.includes('application/json')) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        console.log("Response Body:", data.substring(0, 200));
                        reject(e);
                    }
                } else {
                    console.log("Response Body (Non-JSON):", data.substring(0, 200));
                    resolve({});
                }
            });
            res.on('error', reject);
        });
    });
}

async function test() {
    try {
        console.log("--- Testing Known Good API (Coal OB) ---");
        // Use a date range we know has data or even empty is fine, just need 200 OK
        await fetchData('/api/dashboard/performance/coal-ob-production?fromDate=2025-01-01&toDate=2025-01-01');

        console.log("\n--- Testing Filters API ---");
        await fetchData('/api/dashboard/performance/filters');

    } catch (err) {
        console.error("Error:", err);
    }
}

test();
