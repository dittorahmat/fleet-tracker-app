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

    // Calculate distance and update odometer
    let distanceKm = 0;
    if (lastLog) {
      const { calculateDistanceInMeters } = await import("./db/utils.js");
      const distMeters = calculateDistanceInMeters(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(lastLog.latitude),
        parseFloat(lastLog.longitude)
      );
      distanceKm = distMeters / 1000;
    }

    const [vehicleRecord] = await db.select().from(vehicles).where(eq(vehicles.id, device_id));
    const currentOdo = vehicleRecord ? parseFloat(vehicleRecord.odometer as any) : 0;
    const newOdo = currentOdo + distanceKm;

    const nextOilChange = vehicleRecord ? parseFloat(vehicleRecord.nextOilChange as any) : 10000;
    if (newOdo >= nextOilChange) {
      const [insertedAlert] = await db.insert(alerts).values({
        vehicleId: device_id,
        type: "maintenance_reminder",
        message: `Maintenance Reminder: Vehicle ${device_id} reached ${newOdo.toFixed(1)} km. Oil change due (Limit: ${nextOilChange.toFixed(0)} km).`,
        severity: "medium",
        timestamp: new Date(),
        resolved: false
      }).returning();
      newAlerts.push(insertedAlert);
    }

    // Update vehicle's updatedAt timestamp, odometer
    await db.update(vehicles)
      .set({ 
        odometer: newOdo.toFixed(2),
        updatedAt: new Date() 
      })
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

// POST /api/vehicles/:id/immobilize
app.post("/api/vehicles/:id/immobilize", async (c) => {
  try {
    const db = getDb(c.env);
    const id = c.req.param("id");
    const { status } = await c.req.json();

    if (status === undefined) {
      return c.json({ error: "Missing required 'status' field" }, 400);
    }

    // Check last known speed of the vehicle
    const latestLog = await db.select()
      .from(locationLogs)
      .where(eq(locationLogs.vehicleId, id))
      .orderBy(desc(locationLogs.timestamp))
      .limit(1);

    const speed = latestLog[0] ? parseFloat(latestLog[0].speed as any) : 0;
    
    // Safety check: only allow engine cut-off (status = true) if speed is <= 20 km/h
    if (status && speed > 20) {
      return c.json({ error: "Cannot immobilize: vehicle is moving too fast (speed > 20 km/h)" }, 400);
    }

    // Import active sockets from tcpServer
    const { activeSockets } = await import("./db/tcpServer.js");
    const socket = activeSockets.get(id);

    if (!socket) {
      return c.json({ error: "Vehicle tracker is offline / not connected to TCP server" }, 404);
    }

    // Send control command
    const commandText = status ? "relay:off\n" : "relay:on\n";
    if (status) {
      socket.write(commandText); // Text debugging fallback
      socket.write(Buffer.from([0x78, 0x78, 0x12, 0x80, 0x0A, 0x44, 0x59, 0x44, 0x2C, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x23, 0x00, 0x01, 0xBF, 0x2C]));
    } else {
      socket.write(commandText); // Text debugging fallback
      socket.write(Buffer.from([0x78, 0x78, 0x13, 0x80, 0x0B, 0x48, 0x46, 0x59, 0x44, 0x2C, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x23, 0x00, 0x01, 0x8E, 0xC6]));
    }

    // Update vehicle status in the database
    await db.update(vehicles)
      .set({ relayStatus: status, updatedAt: new Date() })
      .where(eq(vehicles.id, id));

    // Update last log's relayStatus too
    if (latestLog[0]) {
      await db.update(locationLogs)
        .set({ relayStatus: status })
        .where(eq(locationLogs.id, latestLog[0].id));
    }

    // Broadcast update via SSE
    broadcast("location", {
      vehicleId: id,
      relayStatus: status,
      timestamp: new Date()
    });

    return c.json({ message: `Immobilizer command sent successfully: ${status ? 'Engine cut-off' : 'Engine restored'}` });
  } catch (error: any) {
    console.error("Error setting immobilizer:", error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /api/vehicles/:id
app.put("/api/vehicles/:id", async (c) => {
  try {
    const db = getDb(c.env);
    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, plateNumber, vehicleType, rentStatus, odometer, nextOilChange, taxDueDate } = body;

    if (!name) {
      return c.json({ error: "Missing required 'name' field" }, 400);
    }

    const updateData: any = {
      name,
      plateNumber: plateNumber || null,
      vehicleType: vehicleType || null,
      rentStatus: rentStatus || "available",
      updatedAt: new Date()
    };

    if (odometer !== undefined) updateData.odometer = parseFloat(odometer);
    if (nextOilChange !== undefined) updateData.nextOilChange = parseFloat(nextOilChange);
    if (taxDueDate !== undefined) updateData.taxDueDate = taxDueDate ? new Date(taxDueDate) : null;

    const [updatedVehicle] = await db.update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, id))
      .returning();

    if (!updatedVehicle) {
      return c.json({ error: "Vehicle not found" }, 404);
    }

    // Broadcast updated vehicle name via SSE so all consoles reflect the change instantly
    broadcast("vehicle_update", updatedVehicle);

    return c.json(updatedVehicle);
  } catch (error: any) {
    console.error("Error updating vehicle details:", error);
    return c.json({ error: error.message }, 500);
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

// POST /api/geofences
app.post("/api/geofences", async (c) => {
  try {
    const db = getDb(c.env);
    const body = await c.req.json();
    const { name, centerLatitude, centerLongitude, radiusMeters } = body;

    if (!name || centerLatitude === undefined || centerLongitude === undefined || radiusMeters === undefined) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const [insertedGf] = await db.insert(geofences).values({
      name,
      centerLatitude: parseFloat(centerLatitude),
      centerLongitude: parseFloat(centerLongitude),
      radiusMeters: parseFloat(radiusMeters),
    }).returning();

    return c.json(insertedGf, 201);
  } catch (error: any) {
    console.error("Error creating geofence:", error);
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
