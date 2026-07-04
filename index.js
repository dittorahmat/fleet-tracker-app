import { Hono } from "hono";
import { cors } from "hono/cors";
import { getDb } from "./db/connection.js";
import { vehicles, locationLogs } from "./db/schema.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";

const app = new Hono();
app.use("*", cors());

// Helper function to upsert vehicle
async function ensureVehicleExists(db, id) {
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
app.post("/api/locations", async (c) => {
  try {
    const db = getDb(c.env);
    const body = await c.req.json();
    const { device_id, latitude, longitude, speed, heading, timestamp } = body;

    if (!device_id || latitude === undefined || longitude === undefined || speed === undefined || heading === undefined || !timestamp) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    await ensureVehicleExists(db, device_id);

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

    return c.json({ message: "Location telemetry recorded successfully" }, 201);
  } catch (error) {
    console.error("Error ingesting location:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 2.2 GET /api/vehicles (with last known location)
app.get("/api/vehicles", async (c) => {
  try {
    const db = getDb(c.env);
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

    return c.json(result);
  } catch (error) {
    console.error("Error retrieving vehicles:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// 2.3 GET /api/vehicles/:id/history
app.get("/api/vehicles/:id/history", async (c) => {
  try {
    const db = getDb(c.env);
    const id = c.req.param("id");
    const start = c.req.query("start");
    const end = c.req.query("end");

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

    return c.json(history);
  } catch (error) {
    console.error("Error retrieving vehicle history:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
