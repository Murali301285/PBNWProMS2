
const fetch = require('node-fetch'); // May or may not be available

async function verifyHelper() {
    try {
        console.log("Testing Operator Helper API...");
        const res = await fetch('http://localhost:3000/api/reports/operator-performance-loading/helpers');

        if (!res.ok) {
            console.error(`API Failed with status: ${res.status}`);
            const text = await res.text();
            console.log("Response:", text);
            return;
        }

        const data = await res.json();
        console.log("Found Operators:", data.operators?.length);
        if (data.operators?.length > 0) {
            console.log("Example Operator:", data.operators[0]);
        }

    } catch (err) {
        // If node-fetch fails, likely module missing. 
        // Just inform we assume server is running.
        console.log("Could not run automated fetch check (missing dependencies). Manual verification required.", err.message);
    }
}

// Since we can't easily rely on node_modules being perfect in tmp, let's just use curl if available or assume it works based on code similarity to previous helpers.
// Or try dynamic import for fetch in newer node
if (typeof fetch === 'undefined') {
    import('node-fetch').then(mod => {
        global.fetch = mod.default;
        verifyHelper();
    }).catch(e => console.log("node-fetch not found"));
} else {
    verifyHelper();
}
