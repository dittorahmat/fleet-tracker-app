import fs from "fs";

// Read coordinates route list
const routeData = JSON.parse(fs.readFileSync("./simulator/route-jakarta.json", "utf-8"));
const deviceId = process.argv[2] || "dev-truck-01";
const intervalMs = parseInt(process.argv[3]) || 5000;
const serverUrl = "http://localhost:3000/api/locations";

console.log(`Starting simulation for vehicle: ${deviceId}`);
console.log(`Sending coordinates data to ${serverUrl} every ${intervalMs / 1000} seconds...`);

let index = 0;

async function sendUpdate() {
  if (index >= routeData.length) {
    console.log("Route simulation completed. Restarting route...");
    index = 0;
  }

  const point = routeData[index];
  const payload = {
    device_id: deviceId,
    latitude: point.latitude,
    longitude: point.longitude,
    speed: point.speed,
    heading: point.heading,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 201) {
      console.log(`[${new Date().toLocaleTimeString()}] Sent index ${index}: Lat: ${point.latitude}, Lng: ${point.longitude} - Speed: ${point.speed} km/h - Heading: ${point.heading}°`);
      index++;
    } else {
      console.error(`Failed to send data: ${response.status} - ${await response.text()}`);
    }
  } catch (err) {
    console.error("Error sending update:", err.message);
  }
}

// Send first point immediately
sendUpdate();

// Loop through the rest at the defined interval
setInterval(sendUpdate, intervalMs);
