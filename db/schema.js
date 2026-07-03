import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const vehicles = sqliteTable("vehicles", {
  id: text("id").primaryKey(), // Device ID/IMEI
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`),
});

export const locationLogs = sqliteTable("location_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vehicleId: text("vehicle_id").notNull().references(() => vehicles.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  speed: real("speed").notNull(),
  heading: real("heading").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});
