/**
 * GT06 Protocol Parser & Text Helper for debugging
 */

export interface ParsedGpsData {
  deviceId?: string;
  packetType: 'login' | 'location' | 'heartbeat' | 'alarm' | 'unknown';
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  accStatus?: boolean;
  batteryLevel?: number;
  timestamp?: Date;
  alarmType?: string;
}

/**
 * Parses binary or text packets sent by GPS trackers.
 * Supports standard GT06 binary format & text fallback for simple telnet/netcat testing.
 */
export function parsePacket(buffer: Buffer): ParsedGpsData {
  // Check if it's text-based (debugging/manual testing mode)
  const text = buffer.toString('utf8').trim();
  if (text.startsWith('login:') || text.startsWith('gps:')) {
    return parseTextPacket(text);
  }

  // GT06 Protocol Binary parsing
  // Standard GT06 packets start with 0x78 0x78
  if (buffer.length < 5 || buffer[0] !== 0x78 || buffer[1] !== 0x78) {
    return { packetType: 'unknown' };
  }

  const length = buffer[2];
  const protocolNumber = buffer[3];

  // 1. Login Packet (Protocol 0x01)
  if (protocolNumber === 0x01) {
    // Terminal ID (IMEI) is 8 bytes BCD code starting at index 4
    let imei = '';
    for (let i = 4; i < 12; i++) {
      const high = (buffer[i] >> 4) & 0x0f;
      const low = buffer[i] & 0x0f;
      imei += high.toString() + low.toString();
    }
    // Remove leading zeros or trim to standard IMEI format
    const deviceId = imei.replace(/^0+/, '');
    return {
      deviceId,
      packetType: 'login'
    };
  }

  // 2. Location Packet (Protocol 0x12 or 0x22)
  if (protocolNumber === 0x12 || protocolNumber === 0x22) {
    if (buffer.length < 30) {
      return { packetType: 'unknown' };
    }

    // Date & Time (6 bytes starting at index 4)
    const year = buffer[4] + 2000;
    const month = buffer[5] - 1;
    const day = buffer[6];
    const hour = buffer[7];
    const minute = buffer[8];
    const second = buffer[9];
    const timestamp = new Date(Date.UTC(year, month, day, hour, minute, second));

    // Lat & Lng (4 bytes each)
    let latRaw = buffer.readUInt32BE(11);
    let lngRaw = buffer.readUInt32BE(15);

    let latitude = latRaw / 1800000;
    let longitude = lngRaw / 1800000;

    // Read status info for directions / flags
    const statusByte = buffer[20];
    const isGpsPositioned = (statusByte & 0x10) !== 0;
    const isEast = (statusByte & 0x08) !== 0;
    const isNorth = (statusByte & 0x04) !== 0;

    if (!isNorth) latitude = -latitude;
    if (!isEast) longitude = -longitude;

    // Speed (1 byte, in km/h)
    const speed = buffer[19];

    // Course/Heading (2 bytes)
    const heading = buffer.readUInt16BE(20) & 0x03FF;

    // LBS info/flags for status
    // Status / ACC info (usually in a status packet 0x13, but sometimes flagged)
    const accStatus = (buffer[22] & 0x02) !== 0;

    return {
      packetType: 'location',
      latitude,
      longitude,
      speed,
      heading,
      accStatus,
      batteryLevel: 100, // Default to 100 if not in packet
      timestamp
    };
  }

  // 3. Status Packet / Heartbeat (Protocol 0x13)
  if (protocolNumber === 0x13) {
    if (buffer.length < 10) return { packetType: 'unknown' };
    const terminalInfo = buffer[4];
    const accStatus = (terminalInfo & 0x40) !== 0; // Bit 6 ACC status
    const batteryLevelRaw = buffer[5]; // Usually battery voltage/level %
    
    return {
      packetType: 'heartbeat',
      accStatus,
      batteryLevel: batteryLevelRaw,
    };
  }

  // 4. Alarm / Alert Packet (Protocol 0x16)
  if (protocolNumber === 0x16) {
    if (buffer.length < 34) return { packetType: 'unknown' };

    const year = buffer[4] + 2000;
    const month = buffer[5] - 1;
    const day = buffer[6];
    const hour = buffer[7];
    const minute = buffer[8];
    const second = buffer[9];
    const timestamp = new Date(Date.UTC(year, month, day, hour, minute, second));

    let latRaw = buffer.readUInt32BE(11);
    let lngRaw = buffer.readUInt32BE(15);

    let latitude = latRaw / 1800000;
    let longitude = lngRaw / 1800000;

    const statusByte = buffer[20];
    const isEast = (statusByte & 0x08) !== 0;
    const isNorth = (statusByte & 0x04) !== 0;

    if (!isNorth) latitude = -latitude;
    if (!isEast) longitude = -longitude;

    const speed = buffer[19];
    const heading = buffer.readUInt16BE(20) & 0x03FF;

    const alarmByte = buffer[30];
    let alarmType = 'unknown';
    if (alarmByte === 0x02) {
      alarmType = 'power_cut';
    }

    return {
      packetType: 'alarm',
      latitude,
      longitude,
      speed,
      heading,
      alarmType,
      timestamp
    };
  }

  return { packetType: 'unknown' };
}

/**
 * Text-based packet helper for debugging via telnet or simple netcat.
 * Examples:
 * - "login:dev-truck-01"
 * - "gps:-6.175392,106.827153,45.5,180,true,85" (lat,lng,speed,heading,acc,battery)
 */
function parseTextPacket(text: string): ParsedGpsData {
  if (text.startsWith('login:')) {
    const deviceId = text.substring(6).trim();
    return {
      deviceId,
      packetType: 'login'
    };
  }

  if (text.startsWith('alarm:')) {
    const alarmType = text.substring(6).trim();
    return {
      packetType: 'alarm',
      alarmType,
      timestamp: new Date()
    };
  }

  if (text.startsWith('gps:')) {
    const parts = text.substring(4).split(',');
    if (parts.length >= 4) {
      const latitude = parseFloat(parts[0]);
      const longitude = parseFloat(parts[1]);
      const speed = parseFloat(parts[2]);
      const heading = parseFloat(parts[3]);
      const accStatus = parts[4] === 'true' || parts[4] === '1';
      const batteryLevel = parts[5] ? parseInt(parts[5], 10) : 100;

      return {
        packetType: 'location',
        latitude,
        longitude,
        speed,
        heading,
        accStatus,
        batteryLevel,
        timestamp: new Date()
      };
    }
  }

  return { packetType: 'unknown' };
}
