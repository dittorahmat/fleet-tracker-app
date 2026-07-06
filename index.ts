import { Hono } from "hono";
import { cors } from "hono/cors";
import { getDb } from "./db/connection.js";
import { vehicles, locationLogs, geofences, alerts } from "./db/schema.js";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { streamSSE } from "hono/streaming";

import { logger } from "hono/logger";
import { processAlerts } from "./db/alertsEngine.js";
import { addClient, removeClient, broadcast } from "./db/sseManager.js";

const app = new Hono();
app.use("*", logger());
app.use("*", cors());

// Detailed error handler for debugging
app.onError((err: any, c) => {
  console.error("Hono Application Error:", err);
  return c.json({ error: err.message, stack: err.stack }, 500);
});

// Prevent favicon.ico 404 errors
app.get("/favicon.ico", (c) => c.body(null, 204));

// SSE streaming endpoint
app.get("/api/stream", async (c) => {
  return streamSSE(c, async (stream) => {
    const clientId = Math.random().toString(36).substring(2, 10);
    addClient(clientId, stream);

    await stream.writeSSE({
      event: "connected",
      data: JSON.stringify({ clientId }),
    });

    stream.onAbort(() => {
      removeClient(clientId);
    });

    // Heartbeat loop
    while (true) {
      await stream.sleep(20000);
      try {
        await stream.writeSSE({
          event: "ping",
          data: "heartbeat",
        });
      } catch (err) {
        removeClient(clientId);
        break;
      }
    }
  });
});

// Helper function to upsert vehicle
async function ensureVehicleExists(db: any, id: string) {
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

    // Fetch the previous location log for alerting engine geofence transition check
    const [lastLog] = await db.select()
      .from(locationLogs)
      .where(eq(locationLogs.vehicleId, device_id))
      .orderBy(desc(locationLogs.timestamp))
      .limit(1);

    // Insert new location log
    const [insertedLog] = await db.insert(locationLogs).values({
      vehicleId: device_id,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: parseFloat(speed),
      heading: parseFloat(heading),
      timestamp: new Date(timestamp),
    }).returning();

    // Process alerts
    const telemetryPayload = {
      device_id,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: parseFloat(speed),
      timestamp: new Date(timestamp)
    };
    const newAlerts = await processAlerts(db, telemetryPayload, lastLog);

    // Update vehicle's updatedAt timestamp
    await db.update(vehicles)
      .set({ updatedAt: new Date() })
      .where(eq(vehicles.id, device_id));

    // Broadcast location log update via SSE
    broadcast("location", {
      id: insertedLog ? insertedLog.id : null,
      vehicleId: device_id,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: parseFloat(speed),
      heading: parseFloat(heading),
      timestamp: new Date(timestamp)
    });

    // Broadcast newly generated alerts via SSE
    for (const alert of newAlerts) {
      broadcast("alert", alert);
    }

    return c.json({ message: "Location telemetry recorded successfully" }, 201);
  } catch (error: any) {
    console.error("Error ingesting location:", error);
    return c.json({ error: error.message, stack: error.stack }, 500);
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
  } catch (error: any) {
    console.error("Error retrieving vehicles:", error);
    return c.json({ error: error.message, stack: error.stack }, 500);
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
  } catch (error: any) {
    console.error("Error retrieving vehicle history:", error);
    return c.json({ error: error.message, stack: error.stack }, 500);
  }
});

// GET /api/geofences
app.get("/api/geofences", async (c) => {
  try {
    const db = getDb(c.env);
    const result = await db.select().from(geofences);
    return c.json(result);
  } catch (error: any) {
    console.error("Error retrieving geofences:", error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /api/alerts
app.get("/api/alerts", async (c) => {
  try {
    const db = getDb(c.env);
    const result = await db.select()
      .from(alerts)
      .orderBy(desc(alerts.timestamp))
      .limit(50);
    return c.json(result);
  } catch (error: any) {
    console.error("Error retrieving alerts:", error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
