let map, marker;
let logData = [];
let startTime = 0;
let intervalId = null;

const TEST_FILE_URL = "https://speed.cloudflare.com/__down?bytes=1000000"; // 1 MB
const EXPECTED_KB = 1000000 / 1024;

// ============ MAP INITIALIZATION ============
window.onload = () => {
    map = L.map('map').setView([0, 0], 3);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const { latitude, longitude } = pos.coords;
                map.setView([latitude, longitude], 16);
                marker = L.marker([latitude, longitude]).addTo(map);
            },
            () => alert("Please allow location permission."),
            { enableHighAccuracy: true }
        );

        navigator.geolocation.watchPosition(
            pos => {
                const { latitude, longitude } = pos.coords;

                if (marker) marker.setLatLng([latitude, longitude]);
                else marker = L.marker([latitude, longitude]).addTo(map);

                map.setView([latitude, longitude], 16);
            },
            err => console.log("GPS Error:", err),
            { enableHighAccuracy: true }
        );
    }
};

// ============ FIXED SPEED TEST ============
async function measureSpeedKbps() {
    const start = performance.now();

    try {
        const response = await fetch(TEST_FILE_URL, { cache: "no-store" });
        const reader = response.body.getReader();

        // Read chunks for ~300ms
        let receivedBytes = 0;
        let done = false;

        while (!done) {
            const { done: isDone, value } = await reader.read();
            if (value) receivedBytes += value.length;

            // Stop reading after 300 ms
            if (performance.now() - start > 300) break;
            if (isDone) break;
        }

        const end = performance.now();
        const durationSec = (end - start) / 1000;

        const kb = receivedBytes / 1024;
        return Math.round(kb / durationSec);

    } catch (e) {
        console.log("Speed test error:", e);
        return 0;
    }
}

// ============ START BUTTON ============
document.getElementById("startBtn").onclick = () => {
    logData = [];
    startTime = Date.now();

    document.getElementById("startBtn").disabled = true;
    document.getElementById("stopBtn").disabled = false;

    document.getElementById("startBtn").style.opacity = 0.4;

    document.getElementById("output").innerHTML = "<h3>Logging Started...</h3>";

    intervalId = setInterval(async () => {
        const elapsedSec = Math.round((Date.now() - startTime) / 1000);
        const kbps = await measureSpeedKbps();

        logData.push({ time: elapsedSec, kbps });

        // Show live data below
        document.getElementById("output").innerHTML += 
            `<div>Time: ${elapsedSec}s → ${kbps} kbps</div>`;

        console.log("Logged:", elapsedSec, kbps);

    }, 5000);
};

// ============ STOP BUTTON ============
document.getElementById("stopBtn").onclick = () => {
    clearInterval(intervalId);

    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;
    document.getElementById("startBtn").style.opacity = 1;

    // Convert to CSV
    let csv = "time_seconds,kbps\n";
    logData.forEach(row => {
        csv += `${row.time},${row.kbps}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "network_log.csv";
    a.click();

    URL.revokeObjectURL(url);

    document.getElementById("output").innerHTML += `<h3>Logging Stopped. File Downloaded.</h3>`;
};
