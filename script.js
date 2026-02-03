let map, marker;
let logging = false;
let logData = [];
let startTime = 0;
let intervalId = null;

// Initialize map
window.onload = () => {
    map = L.map('map').setView([0, 0], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Track user location on map
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            if (!marker) {
                marker = L.marker([lat, lng]).addTo(map);
            } else {
                marker.setLatLng([lat, lng]);
            }

            map.setView([lat, lng], 16);
        });
    }
};

// Function to measure real download speed
async function measureSpeedKbps() {
    const testUrl = "https://speed.hetzner.de/100MB.bin"; // public test file
    const fileSizeKB = 100 * 1024; // 100MB in KB

    const start = performance.now();
    try {
        const response = await fetch(testUrl, { method: 'GET', cache: "no-store" });
        const reader = response.body.getReader();

        // Only read first chunk to avoid huge download
        await reader.read();
    } catch (e) {
        return 0; // no network
    }
    const end = performance.now();

    const timeSec = (end - start) / 1000;
    return Math.round(fileSizeKB / timeSec); // kbps
}

// Start Logging
document.getElementById("startBtn").onclick = () => {
    logging = true;
    logData = [];
    startTime = Date.now();

    document.getElementById("startBtn").disabled = true;
    document.getElementById("stopBtn").disabled = false;

    intervalId = setInterval(async () => {
        const elapsedSec = Math.round((Date.now() - startTime) / 1000);
        const kbps = await measureSpeedKbps();

        logData.push({
            time: elapsedSec,
            kbps: kbps
        });

        console.log("Logged:", elapsedSec, kbps);
    }, 5000);
};

// Stop Logging + Download CSV
document.getElementById("stopBtn").onclick = () => {
    logging = false;
    clearInterval(intervalId);

    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;

    // Convert to CSV
    let csv = "time_seconds,kbps\n";
    logData.forEach(row => {
        csv += `${row.time},${row.kbps}\n`;
    });

    // Download file
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "network_log.csv";
    a.click();

    URL.revokeObjectURL(url);
};
