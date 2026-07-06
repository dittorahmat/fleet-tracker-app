import { alerts, geofences } from "./schema.js";
import { calculateDistanceInMeters } from "./utils.js";

const SPEED_LIMIT_KMH = 80;

/**
 * Evaluates incoming telemetry against speeding limits and geofences.
 * Returns an array of newly generated alert objects so they can be broadcasted via SSE.
 * 
 * @param {any} db Drizzle DB connection
 * @param {any} telemetry Current ingested telemetry data: { device_id, latitude, longitude, speed, timestamp }
 * @param {any} lastLog Previous location log for the vehicle (optional): { latitude, longitude, timestamp }
 * @returns {Promise<any[]>} Created alerts list
 */
export async function processAlerts(db: any, telemetry: any, lastLog: any) {
  const createdAlerts = [];
  const { device_id, latitude, longitude, speed, timestamp } = telemetry;
  const parsedSpeed = parseFloat(speed);
  const parsedLat = parseFloat(latitude);
  const parsedLng = parseFloat(longitude);
  const eventTime = new Date(timestamp);

  // 1. Speed Limit Check
  if (parsedSpeed > SPEED_LIMIT_KMH) {
    const alertData = {
      vehicleId: device_id,
      type: "overspeeding",
      message: `Speed limit exceeded: ${parsedSpeed.toFixed(1)} km/h (Limit: ${SPEED_LIMIT_KMH} km/h)`,
      severity: "high",
      timestamp: eventTime,
      resolved: false,
    };
    const [insertedAlert] = await db.insert(alerts).values(alertData).returning();
    createdAlerts.push(insertedAlert);
  }

  // 2. Geofence Transition Checks
  const activeGeofences = await db.select().from(geofences);
  for (const gf of activeGeofences) {
    const distCurrent = calculateDistanceInMeters(
      parsedLat,
      parsedLng,
      parseFloat(gf.centerLatitude),
      parseFloat(gf.centerLongitude)
    );
    const isInsideCurrent = distCurrent <= parseFloat(gf.radiusMeters);

    if (lastLog) {
      const distPrev = calculateDistanceInMeters(
        parseFloat(lastLog.latitude),
        parseFloat(lastLog.longitude),
        parseFloat(gf.centerLatitude),
        parseFloat(gf.centerLongitude)
      );
      const wasInsidePrev = distPrev <= parseFloat(gf.radiusMeters);

      // Transition: Inside -> Outside
      if (wasInsidePrev && !isInsideCurrent) {
        const alertData = {
          vehicleId: device_id,
          type: "geofence_exit",
          message: `Vehicle exited geofence: ${gf.name}`,
          severity: "medium",
          timestamp: eventTime,
          resolved: false,
        };
        const [insertedAlert] = await db.insert(alerts).values(alertData).returning();
        createdAlerts.push(insertedAlert);
      }
      // Transition: Outside -> Inside
      else if (!wasInsidePrev && isInsideCurrent) {
        const alertData = {
          vehicleId: device_id,
          type: "geofence_enter",
          message: `Vehicle entered geofence: ${gf.name}`,
          severity: "low",
          timestamp: eventTime,
          resolved: false,
        };
        const [insertedAlert] = await db.insert(alerts).values(alertData).returning();
        createdAlerts.push(insertedAlert);
      }
    } else {
      // If there is no previous log, and they are currently outside, should we flag? 
      // Usually, we only alert on transition. However, if they start inside, we could log it or do nothing.
      // Transition-only is best to avoid alert storms.
    }
  }

  return createdAlerts;
}
