import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db/connection.js";
import { vehicles, locationLogs } from "./db/schema.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serves static dashboard files from 'public' directory
app.use(express.static("public"));

// Helper function to upsert vehicle
async function ensureVehicleExists(id) {
  const existing = await db.select().from(vehicles).where(eq(vehicles.id, id));
  if (existing.length === 0) {
    await db.insert(vehicles).values({
      id,
      name: `Vehicle ${id.substring(0, 6)}`,
      status: "active"
    });
  }
}

// 2.1 POST /api/locations
app.post("/api/locations", async (req, res) => {
  try {
    const { device_id, latitude, longitude, speed, heading, timestamp } = req.body;

    if (!device_id || latitude === undefined || longitude === undefined || speed === undefined || heading === undefined || !timestamp) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await ensureVehicleExists(device_id);

    await db.insert(locationLogs).values({
      vehicleId: device_id,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: parseFloat(speed),
      heading: parseFloat(heading),
      timestamp: new Date(timestamp),
    });

    // Update vehicle's updatedAt timestamp
    await db.update(vehicles)
      .set({ updatedAt: new Date() })
      .where(eq(vehicles.id, device_id));

    res.status(201).json({ message: "Location telemetry recorded successfully" });
  } catch (error) {
    console.error("Error ingesting location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2.2 GET /api/vehicles (with last known location)
app.get("/api/vehicles", async (req, res) => {
  try {
    // Get all vehicles
    const allVehicles = await db.select().from(vehicles);
    
    // For each vehicle, find the latest location log
    const result = [];
    for (const vehicle of allVehicles) {
      const latestLog = await db.select()
        .from(locationLogs)
        .where(eq(locationLogs.vehicleId, vehicle.id))
        .orderBy(desc(locationLogs.timestamp))
        .limit(1);
      
      result.push({
        ...vehicle,
        lastLocation: latestLog[0] || null
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Error retrieving vehicles:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2.3 GET /api/vehicles/:id/history
app.get("/api/vehicles/:id/history", async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;

    let queryConditions = [eq(locationLogs.vehicleId, id)];

    if (start) {
      queryConditions.push(gte(locationLogs.timestamp, new Date(start)));
    }
    if (end) {
      queryConditions.push(lte(locationLogs.timestamp, new Date(end)));
    }

    const history = await db.select()
      .from(locationLogs)
      .where(and(...queryConditions))
      .orderBy(desc(locationLogs.timestamp));

    res.json(history);
  } catch (error) {
    console.error("Error retrieving vehicle history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
