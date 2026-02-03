let map, marker;
let logData = [];
let startTime = 0;
let intervalId = null;
let outputBox = null;

const TEST_FILE_URL = "https://speed.cloudflare.com/__down?bytes=1000000";

// ===================== MAP + DOM READY =====================
window.onload = () => {

    // FIX: outputBox is initialized only AFTER DOM loads (works on mobile)
    outputBox = document.getElementById("output");

    if (!outputBox) {
        alert("ERROR: Output box not loaded. Mobile browser issue.");
        return;
    }

    map = L.map('map').setView([0, 0], 3);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(map);

    // GPS with high accuracy
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


// ===================== SPEED TEST =====================
async function measureSpeedKbps() {
    const start = performance.now();
    try {
        const response = await fetch(TEST_FILE_URL, { cache: "no-store" });
        const reader = response.body.getReader();

        let receivedBytes = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (value) receivedBytes += value.length;

            if (performance.now() - start > 300) break;
            if (done) break;
        }

        const durationSec = (performance.now() - start) / 1000;
        const kb = receivedBytes / 1024;
        return Math.round(kb / durationSec);

    } catch (e) {
        console.log("Speed test error:", e);
        return 0;
    }
}


// ===================== START BUTTON =====================
document.getElementById("startBtn").onclick = () => {

    if (!outputBox) {
        alert("Output element missing!");
        return;
    }

    logData = [];
    startTime = Date.now();

    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");

    startBtn.disabled = true;
    startBtn.style.opacity = 0.4;
    stopBtn.disabled = false;

    outputBox.innerHTML = "<strong>Logging Started...</strong><br><br>";

    intervalId = setInterval(async () => {
        const elapsedSec = Math.round((Date.now() - startTime) / 1000);
        const kbps = await measureSpeedKbps();

        logData.push({ time: elapsedSec, kbps });

        outputBox.innerHTML += `<div><strong>${elapsedSec}s</strong> → ${kbps} kbps</div>`;

        // Auto scroll on mobile to show newest data
        outputBox.scrollTop = outputBox.scrollHeight;

    }, 5000);
};


// ===================== STOP BUTTON =====================
document.getElementById("stopBtn").onclick = () => {
    clearInterval(intervalId);

    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;
    document.getElementById("startBtn").style.opacity = 1;

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

    outputBox.innerHTML += `<br><strong>Logging Stopped. File Downloaded.</strong>`;
};
