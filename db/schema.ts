import { pgTable, varchar, serial, doublePrecision, timestamp, boolean } from "drizzle-orm/pg-core";

export const vehicles = pgTable("vehicles", {
  id: varchar("id", { length: 256 }).primaryKey(), // Device ID/IMEI
  name: varchar("name", { length: 256 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const locationLogs = pgTable("location_logs", {
  id: serial("id").primaryKey(),
  vehicleId: varchar("vehicle_id", { length: 256 }).notNull().references(() => vehicles.id),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  speed: doublePrecision("speed").notNull(),
  heading: doublePrecision("heading").notNull(),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
});

export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  centerLatitude: doublePrecision("center_latitude").notNull(),
  centerLongitude: doublePrecision("center_longitude").notNull(),
  radiusMeters: doublePrecision("radius_meters").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  vehicleId: varchar("vehicle_id", { length: 256 }).notNull().references(() => vehicles.id),
  type: varchar("type", { length: 100 }).notNull(), // 'overspeeding', 'geofence_exit', 'geofence_enter'
  message: varchar("message", { length: 1000 }).notNull(),
  severity: varchar("severity", { length: 50 }).notNull().default("low"),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
  resolved: boolean("resolved").default(false).notNull(),
});
