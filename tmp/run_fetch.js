async function run() {
    try {
        const res = await fetch('http://localhost:3008/api/tmp-check');
        const data = await res.json();
        if (data.recordsets) {
           console.dir(data.recordsets[0], { depth: null });
        } else {
           console.dir(data, { depth: null });
        }
    } catch(e) {
        console.error(e);
    }
}
run();
