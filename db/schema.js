import { pgTable, varchar, serial, doublePrecision, timestamp } from "drizzle-orm/pg-core";

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
