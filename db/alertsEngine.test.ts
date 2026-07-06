import { describe, test, expect, vi } from "vitest";
import { processAlerts } from "./alertsEngine.js";
import { geofences } from "./schema.js";

// Mock database connection
const mockGeofences = [
  {
    id: 1,
    name: "Monas Safe Zone",
    centerLatitude: -6.175392,
    centerLongitude: 106.827153,
    radiusMeters: 1000.0,
    createdAt: new Date(),
  },
];

const createMockDb = (insertedAlerts: any[]) => {
  return {
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((val) => ({
        returning: vi.fn().mockImplementation(async () => {
          insertedAlerts.push(val);
          return [val];
        }),
      })),
    })),
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(async (table) => {
        if (table === geofences) {
          return mockGeofences;
        }
        return [];
      }),
    })),
  } as any;
};

describe("Telemetry Alerting Engine", () => {
  test("should trigger overspeeding alert if speed exceeds 80 km/h", async () => {
    const insertedAlerts: any[] = [];
    const db = createMockDb(insertedAlerts);

    const telemetry = {
      device_id: "truck-01",
      latitude: -6.175392,
      longitude: 106.827153,
      speed: 85.5, // > 80 limit
      timestamp: new Date().toISOString(),
    };

    const newAlerts = await processAlerts(db, telemetry, null);

    expect(newAlerts).toHaveLength(1);
    expect(newAlerts[0].type).toBe("overspeeding");
    expect(newAlerts[0].severity).toBe("high");
    expect(newAlerts[0].message).toContain("Speed limit exceeded");
  });

  test("should NOT trigger overspeeding alert if speed is under 80 km/h", async () => {
    const insertedAlerts: any[] = [];
    const db = createMockDb(insertedAlerts);

    const telemetry = {
      device_id: "truck-01",
      latitude: -6.175392,
      longitude: 106.827153,
      speed: 55.0, // < 80 limit
      timestamp: new Date().toISOString(),
    };

    const newAlerts = await processAlerts(db, telemetry, null);

    expect(newAlerts).toHaveLength(0);
  });

  test("should trigger geofence_exit alert on moving outside a geofence", async () => {
    const insertedAlerts: any[] = [];
    const db = createMockDb(insertedAlerts);

    // Prev point is inside Monas Safe Zone (distance = 0)
    const prevLog = {
      latitude: -6.175392,
      longitude: 106.827153,
      timestamp: new Date(),
    };

    // Current point is outside Monas Safe Zone (approx 2km away)
    const telemetry = {
      device_id: "truck-01",
      latitude: -6.191897,
      longitude: 106.822983,
      speed: 40.0,
      timestamp: new Date().toISOString(),
    };

    const newAlerts = await processAlerts(db, telemetry, prevLog);

    // Should only have geofence_exit alert (speed is fine)
    expect(newAlerts).toHaveLength(1);
    expect(newAlerts[0].type).toBe("geofence_exit");
    expect(newAlerts[0].severity).toBe("medium");
    expect(newAlerts[0].message).toContain("exited geofence");
  });

  test("should trigger geofence_enter alert on moving inside a geofence", async () => {
    const insertedAlerts: any[] = [];
    const db = createMockDb(insertedAlerts);

    // Prev point is outside Monas Safe Zone (approx 2km away)
    const prevLog = {
      latitude: -6.191897,
      longitude: 106.822983,
      timestamp: new Date(),
    };

    // Current point is inside Monas Safe Zone (distance = 0)
    const telemetry = {
      device_id: "truck-01",
      latitude: -6.175392,
      longitude: 106.827153,
      speed: 40.0,
      timestamp: new Date().toISOString(),
    };

    const newAlerts = await processAlerts(db, telemetry, prevLog);

    expect(newAlerts).toHaveLength(1);
    expect(newAlerts[0].type).toBe("geofence_enter");
    expect(newAlerts[0].severity).toBe("low");
    expect(newAlerts[0].message).toContain("entered geofence");
  });
});
