import net from "net";
import { getDb } from "./connection.js";
import { vehicles, locationLogs, alerts } from "./schema.js";
import { eq, desc } from "drizzle-orm";
import { parsePacket } from "./gt06Parser.js";
import { processAlerts } from "./alertsEngine.js";
import { broadcast } from "./sseManager.js";

// In-memory registry mapping deviceId -> Active TCP Socket
export const activeSockets = new Map<string, net.Socket>();

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

export function startTcpServer(port: number = 8000) {
  const server = net.createServer((socket) => {
    let socketDeviceId: string | null = null;
    console.log(`[TCP Server] New connection from ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on("data", async (data) => {
      try {
        const parsed = parsePacket(data as Buffer);

        // Handle Login Packet
        if (parsed.packetType === 'login' && parsed.deviceId) {
          socketDeviceId = parsed.deviceId;
          activeSockets.set(socketDeviceId, socket);
          console.log(`[TCP Server] Device logged in: ${socketDeviceId}`);

          // Response back to device
          const isText = data.toString('utf8').trim().startsWith('login:');
          if (isText) {
            socket.write("login:ok\n");
          } else {
            // Standard GT06 login confirmation packet (0x78 0x78 0x05 0x01 0x00 0x01 0xD9 0xDC)
            socket.write(Buffer.from([0x78, 0x78, 0x05, 0x01, 0x00, 0x01, 0xD9, 0xDC]));
          }
        }

        // Handle Location / Telemetry Packet
        else if (parsed.packetType === 'location') {
          // Fallback device ID from parsed text packet, or bound socket device ID
          const deviceId = parsed.deviceId || socketDeviceId;
          if (!deviceId) {
            console.warn("[TCP Server] Received GPS data but device is not logged in.");
            socket.write("error:not_logged_in\n");
            return;
          }

          const db = getDb();
          await ensureVehicleExists(db, deviceId);

          // Get last known location log for alerts engine (geofence transition)
          const [lastLog] = await db.select()
            .from(locationLogs)
            .where(eq(locationLogs.vehicleId, deviceId))
            .orderBy(desc(locationLogs.timestamp))
            .limit(1);

          const lat = parsed.latitude!;
          const lng = parsed.longitude!;
          const speed = parsed.speed || 0;
          const heading = parsed.heading || 0;
          const accStatus = parsed.accStatus ?? false;
          const batteryLevel = parsed.batteryLevel ?? 100;
          const timestamp = parsed.timestamp || new Date();

          // Insert location log
          const [insertedLog] = await db.insert(locationLogs).values({
            vehicleId: deviceId,
            latitude: lat,
            longitude: lng,
            speed: speed,
            heading: heading,
            accStatus,
            relayStatus: lastLog ? lastLog.relayStatus : false,
            batteryLevel,
            timestamp
          }).returning();

          // Process alerts
          const telemetryPayload = {
            device_id: deviceId,
            latitude: lat,
            longitude: lng,
            speed: speed,
            timestamp
          };
          const newAlerts = await processAlerts(db, telemetryPayload, lastLog);

          // Calculate distance and update odometer
          let distanceKm = 0;
          if (lastLog) {
            const { calculateDistanceInMeters } = await import("./utils.js");
            const distMeters = calculateDistanceInMeters(
              parseFloat(lat as any),
              parseFloat(lng as any),
              parseFloat(lastLog.latitude as any),
              parseFloat(lastLog.longitude as any)
            );
            distanceKm = distMeters / 1000;
          }

          const [vehicleRecord] = await db.select().from(vehicles).where(eq(vehicles.id, deviceId));
          const currentOdo = vehicleRecord ? parseFloat(vehicleRecord.odometer as any) : 0;
          const newOdo = currentOdo + distanceKm;

          const nextOilChange = vehicleRecord ? parseFloat(vehicleRecord.nextOilChange as any) : 10000;
          if (newOdo >= nextOilChange) {
            const [insertedAlert] = await db.insert(alerts).values({
              vehicleId: deviceId,
              type: "maintenance_reminder",
              message: `Maintenance Reminder: Vehicle ${deviceId} reached ${newOdo.toFixed(1)} km. Oil change due (Limit: ${nextOilChange.toFixed(0)} km).`,
              severity: "medium",
              timestamp: new Date(),
              resolved: false
            }).returning();
            newAlerts.push(insertedAlert);
          }

          // Update vehicle status in the database
          await db.update(vehicles)
            .set({
              accStatus,
              batteryLevel,
              odometer: newOdo.toFixed(2),
              updatedAt: new Date()
            })
            .where(eq(vehicles.id, deviceId));

          // Broadcast real-time update to web dashboard via SSE
          broadcast("location", {
            id: insertedLog ? insertedLog.id : null,
            vehicleId: deviceId,
            latitude: lat,
            longitude: lng,
            speed,
            heading,
            accStatus,
            relayStatus: lastLog ? lastLog.relayStatus : false,
            batteryLevel,
            timestamp
          });

          for (const alert of newAlerts) {
            broadcast("alert", alert);
          }

          console.log(`[TCP Server] Logged location for ${deviceId}: ${lat}, ${lng} - Speed: ${speed} - ACC: ${accStatus}`);
          
          if (data.toString('utf8').trim().startsWith('gps:')) {
            socket.write("gps:ok\n");
          }
        }

        // Handle Alarm Packets
        else if (parsed.packetType === 'alarm') {
          const deviceId = parsed.deviceId || socketDeviceId;
          if (!deviceId) {
            console.warn("[TCP Server] Received alarm but device is not logged in.");
            return;
          }

          const db = getDb();
          await ensureVehicleExists(db, deviceId);

          if (parsed.alarmType === 'power_cut') {
            const timestamp = parsed.timestamp || new Date();
            
            // Insert critical alert into database
            const [insertedAlert] = await db.insert(alerts).values({
              vehicleId: deviceId,
              type: "power_cut",
              message: "CRITICAL: GPS tracker external power cut-off detected (potential sabotage/battery disconnected)!",
              severity: "critical",
              timestamp,
              resolved: false
            }).returning();

            // Broadcast critical alert via SSE
            broadcast("alert", insertedAlert);
            
            console.warn(`[TCP Server] CRITICAL ALERT: Power cut detected for device ${deviceId}`);
          }
          
          const isText = data.toString('utf8').trim().startsWith('alarm:');
          if (isText) {
            socket.write("alarm:ok\n");
          }
        }

        // Handle Heartbeat / Status Packets
        else if (parsed.packetType === 'heartbeat') {
          if (!socketDeviceId) return;

          const db = getDb();
          const accStatus = parsed.accStatus ?? false;
          const batteryLevel = parsed.batteryLevel ?? 100;

          await db.update(vehicles)
            .set({
              accStatus,
              batteryLevel,
              updatedAt: new Date()
            })
            .where(eq(vehicles.id, socketDeviceId));

          console.log(`[TCP Server] Heartbeat from ${socketDeviceId} - ACC: ${accStatus}, Battery: ${batteryLevel}%`);
          
          const isText = data.toString('utf8').trim().startsWith('heartbeat:');
          if (isText) {
            socket.write("heartbeat:ok\n");
          }
        }
      } catch (err: any) {
        console.error("[TCP Server] Error processing socket data:", err.message);
      }
    });

    socket.on("close", () => {
      if (socketDeviceId) {
        activeSockets.delete(socketDeviceId);
        console.log(`[TCP Server] Device disconnected: ${socketDeviceId}`);
      }
    });

    socket.on("error", (err) => {
      console.error(`[TCP Server] Socket error for device ${socketDeviceId || 'unknown'}:`, err.message);
    });
  });

  server.listen(port, () => {
    console.log(`[TCP Server] Listening on port ${port}`);
  });

  return server;
}
