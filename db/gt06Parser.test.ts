import { describe, test, expect } from "vitest";
import { parsePacket } from "./gt06Parser.js";

describe("GT06 & Text Parser Utility", () => {
  // 1. Text debugging packets
  test("should parse text login packet successfully", () => {
    const buffer = Buffer.from("login:my-truck-abc");
    const result = parsePacket(buffer);
    
    expect(result.packetType).toBe("login");
    expect(result.deviceId).toBe("my-truck-abc");
  });

  test("should parse text GPS location packet successfully", () => {
    const buffer = Buffer.from("gps:-6.175392,106.827153,45.5,180,true,85");
    const result = parsePacket(buffer);

    expect(result.packetType).toBe("location");
    expect(result.latitude).toBe(-6.175392);
    expect(result.longitude).toBe(106.827153);
    expect(result.speed).toBe(45.5);
    expect(result.heading).toBe(180);
    expect(result.accStatus).toBe(true);
    expect(result.batteryLevel).toBe(85);
  });

  // 2. Binary GT06 packets
  test("should parse binary login packet successfully", () => {
    // 0x78 0x78 (header), 0x0D (length), 0x01 (protocol login)
    // 8 bytes BCD terminal ID: 0x01 0x23 0x45 0x67 0x89 0x01 0x23 0x45
    const loginPacket = Buffer.from([
      0x78, 0x78, 
      0x0D, 
      0x01, 
      0x01, 0x23, 0x45, 0x67, 0x89, 0x01, 0x23, 0x45,
      0x00, 0x01, // serial num
      0xD9, 0xDC  // error check
    ]);

    const result = parsePacket(loginPacket);
    expect(result.packetType).toBe("login");
    expect(result.deviceId).toBe("123456789012345");
  });

  test("should parse binary status/heartbeat packet successfully", () => {
    // 0x78 0x78 (header), 0x0A (length), 0x13 (heartbeat)
    // 0x40 (terminal info status ACC ON), 0x55 (85% battery)
    const statusPacket = Buffer.from([
      0x78, 0x78,
      0x0A,
      0x13,
      0x40, // bit 6 is 1 -> ACC ON
      0x55, // battery level 85
      0x00, 0x01,
      0x00, 0x02,
      0xD9, 0xDC
    ]);

    const result = parsePacket(statusPacket);
    expect(result.packetType).toBe("heartbeat");
    expect(result.accStatus).toBe(true);
    expect(result.batteryLevel).toBe(85);
  });

  test("should parse binary alarm (power_cut) packet successfully", () => {
    // 0x78 0x78 (header), 0x22 (length), 0x16 (protocol alarm)
    // Timestamp (6 bytes), GPS Info, Alarm byte (0x02 is power cut) at index 29 (excluding header length)
    const alarmPacket = Buffer.from([
      0x78, 0x78,
      0x22,
      0x16, // Protocol 0x16 (Alarm)
      26, 7, 6, 12, 0, 0, // Date: 2026-07-06 12:00:00
      0x0F, // GPS quantity
      0x00, 0x6A, 0x5C, 0x10, // Latitude Raw
      0x05, 0xEF, 0xC2, 0x08, // Longitude Raw
      0x28, // Speed (40 km/h)
      0x00, 0x00, // Course
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // LBS info
      0x02, // Alarm byte (0x02 = power cut)
      0x00, // Language
      0x00, 0x01, // Serial
      0xD9, 0xDC // Error check
    ]);

    const result = parsePacket(alarmPacket);
    expect(result.packetType).toBe("alarm");
    expect(result.alarmType).toBe("power_cut");
    expect(result.speed).toBe(40);
  });
});
