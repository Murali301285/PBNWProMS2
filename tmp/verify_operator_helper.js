
const { getDbConnection } = require('./lib/db');
// Mocking executeQuery since we are in a standalone script context
// But wait, my previous helper verification scripts worked.
// Let's use fetch if the server is running, or direct DB check if not.
// The user has `tmp/verify_helper_data.js`. Let's create a new one for operator report.

const fetch = require('node-fetch'); // Might not be available, standard node fetch in newer versions

async function verifyHelper() {
    try {
        console.log("Testing Operator Helper API...");
        const res = await fetch('http://localhost:3000/api/reports/operator-performance-loading/helpers');
        if (!res.ok) {
            console.error(`API Failed with status: ${res.status}`);
            const text = await res.text();
            console.error("Response:", text);
            return;
        }
        const data = await res.json();
        console.log("API Response Keys:", Object.keys(data));
        if (data.operators && Array.isArray(data.operators)) {
            console.log(`Found ${data.operators.length} operators.`);
            console.table(data.operators.slice(0, 5)); // Show first 5
        } else {
            console.error("Invalid response format:", data);
        }

    } catch (err) {
        console.error("Fetch Error:", err.message);
        console.log("Ensure the Next.js server is running on port 3000.");
    }
}

// If fetch is not available or server is not running, let's just inspect the code logic? 
// No, user probably has server running.
verifyHelper();
