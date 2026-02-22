const http = require('http');

function fetchData(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:3000${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
            res.on('error', reject);
        });
    });
}

async function test() {
    try {
        console.log("--- Testing Filters API ---");
        const filters = await fetchData('/api/dashboard/performance/filters');
        console.log("Models:", filters.models?.slice(0, 3));
        console.log("Capacities:", filters.capacities?.slice(0, 3));
        console.log("Shifts:", filters.shifts);

        console.log("\n--- Testing Performance API (No Filters) ---");
        const perf = await fetchData('/api/dashboard/performance/operator-performance?fromDate=2025-01-01&toDate=2025-12-31');
        console.log("Data Length:", perf.data?.length);
        console.log("Sample Row:", perf.data?.[0]);

        if (perf.data?.length > 0) {
            const sample = perf.data[0];
            const model = sample.Model;
            if (model) {
                console.log(`\n--- Testing Performance API (Filter by Model: ${model}) ---`);
                const perfFiltered = await fetchData(`/api/dashboard/performance/operator-performance?fromDate=2025-01-01&toDate=2025-12-31&model=${encodeURIComponent(model)}`);
                console.log("Filtered Data Length:", perfFiltered.data?.length);
                const allMatch = perfFiltered.data?.every(d => d.Model === model);
                console.log("All rows match model?", allMatch);
            }
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

test();
