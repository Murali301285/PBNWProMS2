
// This is a test script to simulate the auto-scroll logic
// and log values to understand why it might not be moving.
// In a real browser environment we'd use the console, but here I'm mocking.

function simulateScroll() {
    // Mock Container
    const scrollContainer = {
        scrollLeft: 0,
        scrollWidth: 1400, // Hypothetical width
        params: {}
    };

    const speed = 0.5;
    let isPaused = false;
    let isManualPaused = false;

    console.log("Starting Simulation...");

    for (let i = 0; i < 10; i++) {
        if (!isPaused && !isManualPaused) {
            const singleSetWidth = scrollContainer.scrollWidth / 4;
            if (scrollContainer.scrollLeft >= singleSetWidth) {
                console.log(`Resetting scroll. Current: ${scrollContainer.scrollLeft}, Limit: ${singleSetWidth}`);
                scrollContainer.scrollLeft = scrollContainer.scrollLeft - singleSetWidth;
            } else {
                scrollContainer.scrollLeft += speed;
                console.log(`Scrolling... New Left: ${scrollContainer.scrollLeft}`);
            }
        } else {
            console.log("Paused via Hover or Manual Toggle");
        }
    }
}

simulateScroll();
