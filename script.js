let map, marker;
let logData = [];
let startTime = 0;
let intervalId = null;

const TEST_FILE_URL = "https://speed.cloudflare.com/__down?bytes=1000000"; // 1 MB test
const TEST_FILE_KB = 1000000 / 1024; // convert to KB

// Initialize map and ask for GPS
window.onload = () => {
    map = L.map('map').setView([0, 0], 3);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                map.setView([lat, lng], 16);
                marker = L.marker([lat, lng]).addTo(map);
            },
            err => {
                alert("Please enable location permission for accurate tracking.");
            },
            {
                enableHighAccuracy: true,
                timeout: 6000
            }
        );

        navigator.geolocation.watchPosition(
            pos => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                if (marker) marker.setLatLng([lat, lng]);
                else marker = L.marker([lat, lng]).addTo(map);

                map.setView([lat, lng], 16);
            },
            err => console.log("GPS Error:", err),
            {
                enableHighAccuracy: true,
                maximumAge: 0
            }
        );
    }
};

// Measure speed in kbps
async function measureSpeedKbps() {
    const start = performance.now();

    try {
        const response = await fetch(TEST_FILE_URL, { cache: "no-store" });
        const reader = response.body.getReader();
        await reader.read(); // only read first chunk
    } catch (e) {
        console.log("Speed test error:", e);
        return 0;
    }

    const end = performance.now();
    const timeSec = (end - start) / 1000;

    // kbps = KB / sec
    return Math.round(TEST_FILE_KB / timeSec);
}

// Start Logging
document.getElementById("startBtn").onclick = () => {
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

// Stop + Download CSV
document.getElementById("stopBtn").onclick = () => {
    clearInterval(intervalId);

    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;

    // Convert to CSV
    let csv = "time_seconds,kbps\n";
    logData.forEach(row => {
        csv += `${row.time},${row.kbps}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "network_log.csv";
    a.click();

    URL.revokeObjectURL(url);
};
