const http = require('http');

const BASE_URL = 'http://localhost:3000/api/master/conversion-factor';

async function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(path || '', BASE_URL);
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- STARTING VERIFICATION ---');

    // 1. GET - Should be success
    console.log('\n1. Testing GET...');
    const getRes = await request('GET');
    console.log('Status:', getRes.status);
    console.log('Count:', Array.isArray(getRes.body) ? getRes.body.length : getRes.body);

    // 2. POST - Add first record
    console.log('\n2. Testing POST (First Record)...');
    const postRes1 = await request('POST', '', {
        FromDate: '2026-01-01',
        ToDate: '2026-12-31',
        Factor: 1.50,
        Remarks: 'Test Entry 1',
        IsActive: true
    });
    console.log('Status:', postRes1.status);
    console.log('Body:', postRes1.body);

    // 3. POST - Add second record (Should fail 400)
    console.log('\n3. Testing POST (Second Record - Should Fail)...');
    const postRes2 = await request('POST', '', {
        FromDate: '2027-01-01',
        ToDate: '2027-12-31',
        Factor: 2.00,
        Remarks: 'Test Entry 2',
        IsActive: true
    });
    console.log('Status:', postRes2.status);
    console.log('Body:', postRes2.body);

    // Get the ID of the created record
    const getRes2 = await request('GET');
    const records = getRes2.body;
    let id = null;
    if (records.length > 0) {
        id = records[0].SlNo || records[0].id;
        console.log('Created ID:', id);
    }

    if (id) {
        // 4. PUT - Update record
        console.log('\n4. Testing PUT...');
        const putRes = await request('PUT', '', {
            id: id,
            Factor: 1.75,
            Remarks: 'Updated Remarks'
        });
        console.log('Status:', putRes.status);
        console.log('Body:', putRes.body);

        // 5. DELETE - Delete record
        console.log('\n5. Testing DELETE...');
        // Note: DELETE typically uses query params in this app based on route code
        const delRes = await request('DELETE', `?id=${id}`);
        console.log('Status:', delRes.status);
        console.log('Body:', delRes.body);

        // 6. POST - Add new record after delete (Should succeed)
        console.log('\n6. Testing POST (After Delete - Should Succeed)...');
        const postRes3 = await request('POST', '', {
            FromDate: '2027-01-01',
            ToDate: '2027-12-31',
            Factor: 2.50,
            Remarks: 'New Entry After Delete',
            IsActive: true
        });
        console.log('Status:', postRes3.status);
        console.log('Body:', postRes3.body);

        // Cleanup: Delete the last created record to leave system clean-ish? 
        // Or leave it for user to see. User asked to "alert" if found, so functionality verification is key.
        // I'll leave it or delete it. Let's delete it to restore state if possible, but leaving it proves it works.
        // I will leave it.
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
}

runTests();
