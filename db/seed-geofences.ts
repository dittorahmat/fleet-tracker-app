import "dotenv/config";
import { getDb } from "./connection.js";
import { geofences } from "./schema.js";

async function main() {
  const db = getDb();
  console.log("Seeding geofences...");

  // Clear existing geofences to avoid duplicates during multiple seeding runs
  await db.delete(geofences);

  // Insert two test geofences:
  // 1. Monas Area Geofence (1km radius)
  await db.insert(geofences).values({
    name: "Monas Safe Zone",
    centerLatitude: -6.175392,
    centerLongitude: 106.827153,
    radiusMeters: 1000.0,
  });

  // 2. Sudirman Area Geofence (1.5km radius)
  await db.insert(geofences).values({
    name: "Sudirman Corridor Zone",
    centerLatitude: -6.210000,
    centerLongitude: 106.820000,
    radiusMeters: 1500.0,
  });

  console.log("Geofences seeded successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
