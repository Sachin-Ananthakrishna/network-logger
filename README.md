# 📶 Network Speed Logger (Web-Based)

A lightweight static website that logs **network download speed (kbps) vs time** and exports it as a **CSV file**.

Works entirely in the browser.  
No backend.  
Fully compatible with GitHub Pages.

---

## 🚀 Features

- 🌍 Built-in interactive map (Leaflet + OpenStreetMap)
- ▶️ **Start** button begins logging
- ⏱ Logs every **5 seconds**
- 📥 Real download speed measurement (kbps)
- ⏳ Saves **elapsed time** since start
- 📄 **Stop** button downloads CSV:
- time_seconds,kbps
    0,320
    5,280
    10,150


---

## 📁 Project Structure

### network-logger/
- index.html # UI layout + map + buttons
- style.css # Styling / UI design
- script.js # Speed test logic + CSV export
- README.md # Documentation

---

## 🧪 How It Works

1. Open the website  
2. Your location appears on the map  
3. Press **Start**  
4. Every 5 seconds:
   - Download speed is measured  
   - Speed (kbps) and time (seconds) are saved  
5. Press **Stop**  
6. CSV file downloads automatically  

---

## 🔧 Technical Details

- Real speed is measured by downloading a test file  
- Only the **first chunk** is read → low data usage  
- CSV uses `time_seconds` and `kbps` columns  
- 100% client-side (no server processing)  

---

