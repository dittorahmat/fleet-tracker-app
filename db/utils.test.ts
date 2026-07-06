import { describe, test, expect } from "vitest";
import { calculateDistanceInMeters } from "./utils.js";

describe("Geodetic Distance Utility (Haversine)", () => {
  test("should return 0 for identical coordinates", () => {
    const lat = -6.175392;
    const lng = 106.827153;
    const dist = calculateDistanceInMeters(lat, lng, lat, lng);
    expect(dist).toBe(0);
  });

  test("should calculate correct distance between Monas and Bundaran HI (approx 1.88km)", () => {
    // Monas coordinates
    const lat1 = -6.175392;
    const lon1 = 106.827153;

    // Bundaran HI coordinates
    const lat2 = -6.191897;
    const lon2 = 106.822983;

    const dist = calculateDistanceInMeters(lat1, lon1, lat2, lon2);
    
    // Distance should be close to 1880 meters
    expect(dist).toBeGreaterThan(1800);
    expect(dist).toBeLessThan(1950);
  });
});
