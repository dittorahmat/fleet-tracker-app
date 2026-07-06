import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  Navigation,
  AlertTriangle,
  Clock,
  Radio,
  History,
  Play,
  Pause,
  RotateCcw,
  Search,
  Bell,
  CheckCircle,
  MapPin,
  List,
  Layers,
  Menu,
  Info,
} from "lucide-react";

// Fix Leaflet marker issue
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

interface LocationTelemetry {
  id?: number | null;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accStatus?: boolean;
  relayStatus?: boolean;
  batteryLevel?: number;
  timestamp: string | Date;
}

interface Vehicle {
  id: string;
  name: string;
  status: string;
  plateNumber?: string | null;
  vehicleType?: string | null;
  rentStatus?: string;
  odometer?: string | number;
  nextOilChange?: string | number;
  taxDueDate?: string | Date | null;
  accStatus?: boolean;
  relayStatus?: boolean;
  batteryLevel?: number;
  updatedAt: string | Date;
  lastLocation: LocationTelemetry | null;
}

interface Geofence {
  id: number;
  name: string;
  centerLatitude: number | string;
  centerLongitude: number | string;
  radiusMeters: number | string;
  createdAt: string | Date;
}

interface Alert {
  id?: number | string;
  vehicleId: string;
  type: string;
  message: string;
  severity: string;
  timestamp: string | Date;
  resolved: boolean;
}

interface ToastAlert extends Alert {
  id: string;
}

const DefaultIcon = L.icon({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom rotated marker icon using DivIcon
const createVehicleIcon = (heading: number, isSelected: boolean, status: string) => {
  const borderCol = isSelected ? "border-indigo-400 scale-110 ring-4 ring-indigo-500/30" : "border-slate-800";
  const bgCol = status === "active" ? "bg-emerald-500" : "bg-amber-500";
  
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <!-- Pulse effect for selected vehicle -->
        ${isSelected ? `<div class="absolute w-10 h-10 rounded-full bg-indigo-500/30 animate-ping"></div>` : ""}
        <div class="w-8 h-8 rounded-full border-2 ${borderCol} ${bgCol} text-white flex items-center justify-center shadow-2xl transition-all duration-300">
          <div class="w-4 h-4 flex items-center justify-center transition-transform duration-300" style="transform: rotate(${heading || 0}deg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3">
              <polygon points="12,2 22,22 12,17 2,22" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
    `,
    className: "custom-marker-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Component to dynamically update map center/bounds
function ChangeMapView({ center, zoom, bounds }: { center: [number, number]; zoom: number; bounds: [number, number][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] });
    } else if (center) {
      map.setView(center as L.LatLngExpression, zoom || map.getZoom());
    }
  }, [center, zoom, bounds, map]);
  return null;
}

function MapEventsHandler({ onDoubleClick }: { onDoubleClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    dblclick(e) {
      onDoubleClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

const API_BASE = window.location.port === "5173" ? "http://localhost:3000" : "";

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  
  // Edit vehicle metadata states
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPlate, setEditPlate] = useState("");
  const [editType, setEditType] = useState("");
  const [editRentStatus, setEditRentStatus] = useState("available");
  const [editOdometer, setEditOdometer] = useState("");
  const [editNextOil, setEditNextOil] = useState("");
  const [editTaxDue, setEditTaxDue] = useState("");
  
  // Search query
  const [searchQuery, setSearchQuery] = useState("");

  // History & Playback states
  const [historyLogs, setHistoryLogs] = useState<LocationTelemetry[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // multiplier
  const playbackTimerRef = useRef<any>(null);

  // SSE connection state
  const [sseConnected, setSseConnected] = useState<boolean>(false);

  // Map center/bounds controls
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.175392, 106.827153]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [mapBounds, setMapBounds] = useState<[number, number][] | null>(null);

  // Responsive sidebar toggles
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  // Close sidebars by default on small viewports (tablet/mobile)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsLeftSidebarOpen(false);
      setIsRightSidebarOpen(false);
    }
  }, []);

  // 1. Initial Data Fetching
  useEffect(() => {
    // Fetch vehicles
    fetch(`${API_BASE}/api/vehicles`)
      .then((res) => res.json())
      .then((data) => setVehicles(data))
      .catch((err) => console.error("Error fetching vehicles:", err));

    // Fetch geofences
    fetch(`${API_BASE}/api/geofences`)
      .then((res) => res.json())
      .then((data) => setGeofences(data))
      .catch((err) => console.error("Error fetching geofences:", err));

    // Fetch historical alerts
    fetch(`${API_BASE}/api/alerts`)
      .then((res) => res.json())
      .then((data) => setAlerts(data))
      .catch((err) => console.error("Error fetching alerts:", err));
  }, []);

  // 2. Connect to Server-Sent Events (SSE) stream
  useEffect(() => {
    const sseUrl = `${API_BASE}/api/stream`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setSseConnected(true);
      console.log("SSE Stream connected successfully.");
    };

    eventSource.onerror = () => {
      setSseConnected(false);
      console.error("SSE connection lost. Reconnecting...");
    };

    // Location updates
    eventSource.addEventListener("location", (e) => {
      const payload = JSON.parse(e.data);
      setVehicles((prevVehicles) => {
        const index = prevVehicles.findIndex((v) => v.id === payload.vehicleId);
        if (index === -1) {
          // If vehicle is new, we insert a placeholder vehicle record
          return [
            ...prevVehicles,
            {
              id: payload.vehicleId,
              name: `Vehicle ${payload.vehicleId.substring(0, 6)}`,
              status: "active",
              accStatus: payload.accStatus,
              relayStatus: payload.relayStatus,
              batteryLevel: payload.batteryLevel,
              updatedAt: payload.timestamp,
              lastLocation: payload,
            },
          ];
        } else {
          const updated = [...prevVehicles];
          updated[index] = {
            ...updated[index],
            accStatus: payload.accStatus !== undefined ? payload.accStatus : updated[index].accStatus,
            relayStatus: payload.relayStatus !== undefined ? payload.relayStatus : updated[index].relayStatus,
            batteryLevel: payload.batteryLevel !== undefined ? payload.batteryLevel : updated[index].batteryLevel,
            updatedAt: payload.timestamp,
            lastLocation: payload,
          };
          return updated;
        }
      });
    });

    // Vehicle metadata updates
    eventSource.addEventListener("vehicle_update", (e) => {
      const payload = JSON.parse(e.data);
      setVehicles((prev) =>
        prev.map((v) => (v.id === payload.id ? { 
          ...v, 
          name: payload.name,
          plateNumber: payload.plateNumber,
          vehicleType: payload.vehicleType,
          rentStatus: payload.rentStatus,
          odometer: payload.odometer,
          nextOilChange: payload.nextOilChange,
          taxDueDate: payload.taxDueDate
        } : v))
      );
    });

    // Alert updates
    eventSource.addEventListener("alert", (e) => {
      const alert = JSON.parse(e.data);
      
      // Prepend to alerts feed
      setAlerts((prev) => [alert, ...prev].slice(0, 100));

      // Push a new Toast notification
      const toastId = Math.random().toString(36).substring(2);
      setToasts((prev) => [...prev, { id: toastId, ...alert }]);

      // Auto-clear toast after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 6000);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // 3. Playback timer handler
  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = setInterval(() => {
        setPlaybackIndex((prevIndex) => {
          if (prevIndex >= historyLogs.length - 1) {
            setIsPlaying(false);
            clearInterval(playbackTimerRef.current);
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, historyLogs, playbackSpeed]);

  // Keyboard Shortcuts for Route Playback
  useEffect(() => {
    if (historyLogs.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setHistoryLogs([]);
        setIsPlaying(false);
        setPlaybackIndex(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [historyLogs.length]);

  // Load vehicle history route
  const handleLoadHistory = (vehicleId: string) => {
    setIsPlaying(false);
    setPlaybackIndex(0);
    setHistoryLogs([]);

    fetch(`${API_BASE}/api/vehicles/${vehicleId}/history`)
      .then((res) => res.json())
      .then((data) => {
        if (data.length === 0) {
          alert(`No history found for vehicle ${vehicleId}`);
          return;
        }
        // Logs are returned in descending order; reverse to play forward
        const forwardLogs = [...data].reverse();
        setHistoryLogs(forwardLogs);
        
        // Fit map bounds to the historical route
        const bounds: [number, number][] = forwardLogs.map((log) => [log.latitude, log.longitude]);
        setMapBounds(bounds);
      })
      .catch((err) => console.error("Error fetching vehicle history:", err));
  };

  // Center map on vehicle coordinates
  const handleCenterOnVehicle = (vehicle: Vehicle) => {
    if (vehicle.lastLocation) {
      setMapCenter([vehicle.lastLocation.latitude, vehicle.lastLocation.longitude]);
      setMapZoom(15);
      setMapBounds(null);
    }
  };

  // Center map on vehicle from alert feed click
  const handleSelectAndLocateAlertVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      handleCenterOnVehicle(vehicle);
    }
  };

  const handleMapDoubleClick = async (lat: number, lng: number) => {
    const name = prompt("Enter new Geofence name:");
    if (!name) return;

    const radiusInput = prompt("Enter radius in meters (e.g. 500):", "500");
    if (!radiusInput) return;
    const radiusMeters = parseFloat(radiusInput);
    if (isNaN(radiusMeters) || radiusMeters <= 0) {
      alert("Invalid radius!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/geofences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          centerLatitude: lat,
          centerLongitude: lng,
          radiusMeters
        })
      });
      if (res.ok) {
        const newGf = await res.json();
        setGeofences((prev) => [...prev, newGf]);
        alert("Geofence created successfully!");
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err: any) {
      alert(`Failed to save geofence: ${err.message}`);
    }
  };

  // Filter vehicles by search query
  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = searchQuery.toLowerCase();
    return (
      vehicle.id.toLowerCase().includes(query) ||
      vehicle.name.toLowerCase().includes(query)
    );
  });

  const activePlaybackLog = historyLogs[playbackIndex];

  return (
    <div className="flex flex-col h-full w-full bg-radar-bg text-slate-100 antialiased overflow-hidden">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-6 py-4 bg-radar-surface/80 border-b border-radar-border backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg border border-radar-border bg-radar-bg/40 hover:bg-radar-bg focus:outline-none focus:ring-1 focus:ring-radar-primary"
            aria-label={isLeftSidebarOpen ? "Collapse vehicle list" : "Expand vehicle list"}
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="p-2 bg-radar-primary rounded-lg shadow-lg shadow-radar-primary/30 text-white">
            <Navigation className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0">FleetTracker PRO</h1>
            <p className="text-xs text-slate-400 m-0">Real-Time Control Center</p>
          </div>
        </div>

        {/* Server Status Panel */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-radar-bg/50 rounded-full border border-radar-border text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                sseConnected ? "bg-radar-green animate-pulse" : "bg-radar-red"
              }`}
            ></span>
            <span className="font-medium text-slate-300">
              {sseConnected ? "Telemetry Stream Connected" : "Stream Disconnected"}
            </span>
          </div>

          <div className="flex gap-4 text-xs font-semibold">
            <div className="px-4 py-2 bg-radar-primary/10 border border-radar-primary/20 text-radar-primary rounded-lg">
              <span className="text-slate-400 mr-1.5">Vehicles:</span>
              {vehicles.length}
            </div>
            <div className="px-4 py-2 bg-radar-amber/10 border border-radar-amber/20 text-radar-amber rounded-lg">
              <span className="text-slate-400 mr-1.5">Geofences:</span>
              {geofences.length}
            </div>
          </div>

          <button
            onClick={() => setIsInfoOpen(true)}
            className="p-2 text-slate-400 hover:text-white rounded-lg border border-radar-border bg-radar-bg/40 hover:bg-radar-bg focus:outline-none focus:ring-1 focus:ring-radar-primary"
            aria-label="View system threshold information"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg border border-radar-border bg-radar-bg/40 hover:bg-radar-bg focus:outline-none focus:ring-1 focus:ring-radar-primary"
            aria-label={isRightSidebarOpen ? "Collapse alert feed" : "Expand alert feed"}
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Left Panel: Vehicle List */}
        <aside
          className={`w-80 flex flex-col bg-radar-surface border-r border-radar-border shrink-0 transition-all duration-300 ${
            isLeftSidebarOpen ? "translate-x-0 ml-0" : "-translate-x-full -ml-80"
          } absolute lg:relative z-20 h-full lg:h-auto`}
        >
          <div className="p-4 border-b border-radar-border">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search vehicle ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search vehicles by name or ID"
                className="w-full bg-radar-bg border border-radar-border rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-radar-primary focus:ring-1 focus:ring-radar-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <List className="w-3.5 h-3.5" />
              <span>Armada List ({filteredVehicles.length})</span>
            </div>

            {filteredVehicles.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-sm">
                No vehicles found.
              </div>
            ) : (
              filteredVehicles.map((vehicle) => {
                const isSelected = selectedVehicleId === vehicle.id;
                const loc = vehicle.lastLocation;
                
                return (
                  <div
                    key={vehicle.id}
                    role="button"
                    tabIndex={0}
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedVehicleId(vehicle.id);
                      handleCenterOnVehicle(vehicle);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedVehicleId(vehicle.id);
                        handleCenterOnVehicle(vehicle);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-radar-primary ${
                      isSelected
                        ? "bg-radar-primary/10 border-radar-primary/50 shadow-md shadow-radar-primary/5"
                        : "bg-radar-bg/40 border-radar-border hover:border-slate-700 hover:bg-radar-bg/80"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-200 text-sm m-0">
                          {vehicle.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          ID: {vehicle.id}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          vehicle.status === "active"
                            ? "bg-radar-green/10 text-radar-green border border-radar-green/20"
                            : "bg-radar-border text-slate-400"
                        }`}
                      >
                        {vehicle.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] border-t border-radar-border/40 pt-1.5">
                      <span className={`font-mono flex items-center gap-1 ${vehicle.accStatus ? "text-radar-green font-bold" : "text-slate-500"}`}>
                        ● ACC: {vehicle.accStatus ? "ON" : "OFF"}
                      </span>
                      <span className="text-slate-400 font-mono">
                        ⚡ Bat: {vehicle.batteryLevel ?? 100}%
                      </span>
                      {vehicle.relayStatus && (
                        <span className="bg-radar-red/25 text-radar-red border border-radar-red/30 font-bold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                          IMMOBILIZED
                        </span>
                      )}
                    </div>

                    {loc ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-radar-border/80 pt-2.5 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-radar-primary shrink-0" />
                          <span className="font-semibold text-slate-200">
                            {loc.speed.toFixed(1)} km/h
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-[10px]">
                            {new Date(loc.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 mt-2">No location details logged.</p>
                    )}

                    {isSelected && (
                      <div className="mt-3 flex flex-col gap-2 border-t border-radar-border/80 pt-2.5">
                        {/* Extended Metadata Display */}
                        <div className="bg-radar-bg/60 p-3 rounded-lg border border-radar-border/80 text-[11px] space-y-1.5 font-mono text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Plate Number:</span>
                            <span className="font-bold text-slate-200">{vehicle.plateNumber || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Vehicle Type:</span>
                            <span className="text-slate-200">{vehicle.vehicleType || "-"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Odometer:</span>
                            <span className="font-bold text-radar-primary">{vehicle.odometer || "0.00"} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Next Oil Service:</span>
                            <span className="text-radar-amber">{vehicle.nextOilChange || "10000"} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Rent Status:</span>
                            <span className={`font-bold px-1.5 rounded uppercase ${
                              vehicle.rentStatus === 'available' ? 'text-radar-green bg-radar-green/10' :
                              vehicle.rentStatus === 'rented' ? 'text-radar-amber bg-radar-amber/10' : 'text-slate-400 bg-slate-400/10'
                            }`}>
                              {vehicle.rentStatus || 'available'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditName(vehicle.name);
                              setEditPlate(vehicle.plateNumber || "");
                              setEditType(vehicle.vehicleType || "");
                              setEditRentStatus(vehicle.rentStatus || "available");
                              setEditOdometer(String(vehicle.odometer || "0"));
                              setEditNextOil(String(vehicle.nextOilChange || "10000"));
                              setEditTaxDue(vehicle.taxDueDate ? new Date(vehicle.taxDueDate).toISOString().substring(0, 10) : "");
                              setIsEditingMetadata(true);
                            }}
                            className="flex-1 bg-radar-bg border border-radar-border text-[11px] font-semibold py-1.5 rounded-lg hover:bg-radar-surface hover:text-white transition-colors"
                          >
                            Edit Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadHistory(vehicle.id);
                            }}
                            aria-label={`View history logs of vehicle ${vehicle.id}`}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-radar-bg border border-radar-border text-[11px] font-semibold py-1.5 rounded-lg hover:bg-radar-surface hover:text-white transition-colors"
                          >
                            <History className="w-3 h-3" />
                            <span>History</span>
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCenterOnVehicle(vehicle);
                            }}
                            aria-label={`Locate vehicle ${vehicle.id} on map`}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-radar-primary text-white text-[11px] font-semibold py-1.5 rounded-lg hover:bg-radar-primary-hover transition-colors"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Locate</span>
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              
                              const confirmPin = prompt("Enter Admin PIN to toggle vehicle power state:");
                              if (confirmPin !== "1234") {
                                alert("Unauthorized! Incorrect Admin PIN.");
                                return;
                              }

                              const newStatus = !vehicle.relayStatus;
                              try {
                                const res = await fetch(`${API_BASE}/api/vehicles/${vehicle.id}/immobilize`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: newStatus })
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  alert(data.message);
                                  setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, relayStatus: newStatus } : v));
                                } else {
                                  alert(`Error: ${data.error}`);
                                }
                              } catch (err: any) {
                                alert(`Connection failed: ${err.message}`);
                              }
                            }}
                            aria-label={`Toggle engine power for vehicle ${vehicle.id}`}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg border transition-colors ${
                              vehicle.relayStatus
                                ? "bg-radar-red text-white hover:bg-radar-red/80 border-radar-red"
                                : "bg-radar-bg border-radar-red/40 text-radar-red hover:bg-radar-red/10"
                            }`}
                          >
                            <span>{vehicle.relayStatus ? "Enable Engine" : "Disable Engine"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Center Panel: Map & Playback Control */}
        <main className="flex-1 flex flex-col relative bg-radar-bg">
          <div className="flex-1 relative">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              className="w-full h-full z-0"
              zoomControl={false}
              doubleClickZoom={false}
            >
              <MapEventsHandler onDoubleClick={handleMapDoubleClick} />
              {/* Dark Styled OpenStreetMap Tiles */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />

              {/* View updater */}
              <ChangeMapView center={mapCenter} zoom={mapZoom} bounds={mapBounds} />

              {/* Render Geofences circles */}
              {geofences.map((gf) => (
                <Circle
                  key={gf.id}
                  center={[parseFloat(String(gf.centerLatitude)), parseFloat(String(gf.centerLongitude))]}
                  radius={parseFloat(String(gf.radiusMeters))}
                  pathOptions={{
                    color: "#f59e0b",
                    fillColor: "#f59e0b",
                    fillOpacity: 0.1,
                    dashArray: "6, 6",
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-slate-900 font-sans text-xs">
                      <strong className="block text-sm mb-0.5">{gf.name}</strong>
                      <span>Radius: {gf.radiusMeters} meters</span>
                    </div>
                  </Popup>
                </Circle>
              ))}

              {/* Render Real-Time Vehicle Markers */}
              {historyLogs.length === 0 &&
                vehicles
                  .filter((v) => v.lastLocation)
                  .map((vehicle) => {
                    const loc = vehicle.lastLocation!;
                    const isSelected = selectedVehicleId === vehicle.id;
                    return (
                      <Marker
                        key={vehicle.id}
                        position={[loc.latitude, loc.longitude]}
                        icon={createVehicleIcon(loc.heading, isSelected, vehicle.status)}
                        eventHandlers={{
                          click: () => setSelectedVehicleId(vehicle.id),
                        }}
                      >
                        <Popup>
                          <div className="text-slate-900 font-sans text-xs">
                            <strong className="block text-sm mb-1">{vehicle.name}</strong>
                            <div className="space-y-0.5">
                              <div>Speed: <strong>{loc.speed.toFixed(1)} km/h</strong></div>
                              <div>Heading: <strong>{loc.heading}°</strong></div>
                              <div>Last Update: <strong>{new Date(loc.timestamp).toLocaleTimeString()}</strong></div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

              {/* Render Historical Route Polyline */}
              {historyLogs.length > 0 && (
                <>
                  <Polyline
                    positions={historyLogs.map((log) => [log.latitude, log.longitude])}
                    pathOptions={{ color: "#6366f1", weight: 4, opacity: 0.8 }}
                  />
                  {historyLogs.map((log, idx) => (
                    <Circle
                      key={`point-${idx}`}
                      center={[log.latitude, log.longitude]}
                      radius={4}
                      pathOptions={{
                        color: idx === playbackIndex ? "#ef4444" : "#818cf8",
                        fillColor: idx === playbackIndex ? "#ef4444" : "#818cf8",
                        fillOpacity: 1,
                      }}
                    />
                  ))}

                  {/* Playback Moving Marker */}
                  {activePlaybackLog && (
                    <Marker
                      position={[activePlaybackLog.latitude, activePlaybackLog.longitude]}
                      icon={createVehicleIcon(
                        activePlaybackLog.heading,
                        true,
                        "active"
                      )}
                    >
                      <Popup>
                        <div className="text-slate-900 font-sans text-xs">
                          <strong className="block text-sm mb-1">Playback Telemetry</strong>
                          <div className="space-y-0.5">
                            <div>Speed: <strong>{activePlaybackLog.speed.toFixed(1)} km/h</strong></div>
                            <div>Heading: <strong>{activePlaybackLog.heading}°</strong></div>
                            <div>Time: <strong>{new Date(activePlaybackLog.timestamp).toLocaleTimeString()}</strong></div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </>
              )}
            </MapContainer>

            {/* Float HUD controls */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-5">
              <div className="bg-radar-surface/90 border border-radar-border p-3 rounded-xl flex items-center gap-3 backdrop-blur shadow-2xl">
                <Layers className="w-5 h-5 text-radar-primary" />
                <div>
                  <h5 className="text-xs font-semibold text-slate-200 m-0">Live Traffic Control</h5>
                  <p className="text-[10px] text-slate-500 m-0">Standard Street Layer</p>
                </div>
              </div>
            </div>

            {/* Route Playback Control Bar */}
            {historyLogs.length > 0 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-radar-surface/95 border border-radar-border p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-3 z-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-radar-primary animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="text-xs font-bold text-slate-300">
                      Route Playback: Vehicle {selectedVehicleId}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setHistoryLogs([]);
                      setIsPlaying(false);
                      setPlaybackIndex(0);
                    }}
                    aria-label="Exit playback mode"
                    className="text-[10px] text-slate-400 hover:text-white bg-radar-bg hover:bg-radar-surface px-2.5 py-1 rounded-md transition-colors"
                  >
                    Exit Playback
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  {/* Play / Pause */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? "Pause playback" : "Play playback"}
                    className="p-2.5 bg-radar-primary hover:bg-radar-primary-hover text-white rounded-xl shadow-lg shadow-radar-primary/30 transition-all focus:outline-none"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  {/* Reset */}
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setPlaybackIndex(0);
                    }}
                    aria-label="Reset playback"
                    className="p-2.5 bg-radar-bg hover:bg-radar-surface border border-radar-border text-slate-300 rounded-xl transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Progress slider */}
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-mono w-8">
                      {playbackIndex + 1}/{historyLogs.length}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max={historyLogs.length - 1}
                      value={playbackIndex}
                      aria-label="Playback timeline progress"
                      onChange={(e) => {
                        setIsPlaying(false);
                        setPlaybackIndex(parseInt(e.target.value));
                      }}
                      className="flex-1 h-1 bg-radar-border rounded-lg appearance-none cursor-pointer accent-radar-primary"
                    />
                  </div>

                  {/* Speed Controls */}
                  <div className="flex items-center gap-1.5 bg-radar-bg px-2 py-1 rounded-lg border border-radar-border">
                    <span className="text-[10px] text-slate-500 font-bold px-1 uppercase">Speed</span>
                    {[1, 2, 4].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        aria-label={`Set speed to ${speed}x`}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all font-bold ${
                          playbackSpeed === speed
                            ? "bg-radar-primary text-white"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                {activePlaybackLog && (
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono bg-radar-bg/40 p-2 rounded-lg border border-radar-border">
                    <span>Speed: <strong className="text-slate-300">{activePlaybackLog.speed.toFixed(1)} km/h</strong></span>
                    <span>Heading: <strong className="text-slate-300">{activePlaybackLog.heading}°</strong></span>
                    <span>Lat: <strong className="text-slate-300">{activePlaybackLog.latitude.toFixed(6)}</strong></span>
                    <span>Lng: <strong className="text-slate-300">{activePlaybackLog.longitude.toFixed(6)}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Right Panel: Alerts & Notifications Feed */}
        <aside
          className={`w-80 flex flex-col bg-radar-surface border-l border-radar-border shrink-0 transition-all duration-300 ${
            isRightSidebarOpen ? "translate-x-0 mr-0" : "translate-x-full -mr-80"
          } absolute lg:relative right-0 z-20 h-full lg:h-auto`}
        >
          <div className="p-4 border-b border-radar-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-radar-amber" />
              <h3 className="font-bold text-slate-200 text-sm m-0">Alert Feeds</h3>
            </div>
            <span className="text-[10px] font-semibold bg-radar-red/10 text-radar-red border border-radar-red/20 px-2 py-0.5 rounded-full">
              {alerts.length} Total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                No alerts detected. Safe operation.
              </div>
            ) : (
              alerts.map((alert, idx) => {
                const isOverSpeed = alert.type === "overspeeding";
                const isExit = alert.type === "geofence_exit";
                const isPowerCut = alert.type === "power_cut";
                const isMaintenance = alert.type === "maintenance_reminder";
                const cardBorder = isPowerCut
                  ? "border-radar-red bg-radar-red/10 animate-pulse border-2 shadow-lg shadow-radar-red/10"
                  : isOverSpeed
                  ? "border-radar-red/30 bg-radar-red/5"
                  : isExit
                  ? "border-radar-amber/30 bg-radar-amber/5"
                  : isMaintenance
                  ? "border-radar-amber/50 bg-radar-amber/10"
                  : "border-radar-primary/30 bg-radar-primary/5";
                const badgeText = isPowerCut
                  ? "SABOTAGE / POWER CUT"
                  : isOverSpeed
                  ? "Speed Limit"
                  : isExit
                  ? "Geofence Exit"
                  : isMaintenance
                  ? "Maintenance"
                  : "Geofence Entry";
                const badgeColor = isPowerCut
                  ? "bg-radar-red text-white"
                  : isOverSpeed
                  ? "bg-radar-red/20 text-radar-red"
                  : isExit
                  ? "bg-radar-amber/20 text-radar-amber"
                  : isMaintenance
                  ? "bg-radar-amber/30 text-radar-amber"
                  : "bg-radar-primary/20 text-radar-primary";

                return (
                  <div
                    key={`${alert.id || idx}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectAndLocateAlertVehicle(alert.vehicleId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectAndLocateAlertVehicle(alert.vehicleId);
                      }
                    }}
                    aria-label={`Alert for vehicle ${alert.vehicleId}: ${alert.message}. Click to locate.`}
                    className={`p-3 rounded-xl border ${cardBorder} transition-all duration-200 cursor-pointer hover:border-radar-primary focus:outline-none focus:ring-1 focus:ring-radar-primary`}
                  >
                    <div className="flex items-center justify-between mb-1.5 font-mono">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${badgeColor}`}>
                        {badgeText}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(alert.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                    <h5 className="text-xs font-semibold text-slate-200 mb-1 m-0">
                      Vehicle {alert.vehicleId}
                    </h5>
                    <p className="text-[11px] leading-relaxed text-slate-400 m-0">
                      {alert.message}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* Floating sliding Toast notifications for real-time notifications */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 pointer-events-none">
        {toasts.map((toast) => {
          const isPowerCut = toast.type === "power_cut";
          const isOverSpeed = toast.type === "overspeeding";
          const iconColor = isPowerCut ? "text-white animate-pulse" : isOverSpeed ? "text-radar-red" : "text-radar-amber";
          const toastBg = isPowerCut ? "bg-radar-red border-white text-white animate-bounce shadow-radar-red/20 shadow-2xl" : "bg-radar-surface/95 border-radar-border text-slate-100";
          const toastBadge = isPowerCut ? "text-white font-bold" : "text-radar-primary font-bold";
          
          return (
            <div
              key={toast.id}
              className={`w-80 border p-4 rounded-xl shadow-2xl flex gap-3.5 pointer-events-auto animate-slide-in backdrop-blur-md ${toastBg}`}
              style={{
                animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div className="shrink-0 p-1.5 bg-radar-bg/40 rounded-lg">
                <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] uppercase tracking-wide ${toastBadge}`}>
                    {isPowerCut ? "CRITICAL SABOTAGE" : "New Alert Triggered"}
                  </span>
                  <span className={`text-[9px] ${isPowerCut ? "text-white/80" : "text-slate-500"}`}>Just Now</span>
                </div>
                <h4 className={`text-xs font-bold mt-1 m-0 ${isPowerCut ? "text-white" : "text-slate-100"}`}>
                  Vehicle {toast.vehicleId}
                </h4>
                <p className={`text-[11px] mt-0.5 m-0 ${isPowerCut ? "text-white/90" : "text-slate-400"}`}>
                  {toast.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Vehicle Metadata Modal */}
      {isEditingMetadata && selectedVehicleId && (() => {
        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
        if (!vehicle) return null;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-radar-surface border border-radar-border w-full max-w-md p-6 rounded-2xl shadow-2xl animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-radar-border pb-3 mb-4">
                <h3 className="font-bold text-white text-sm m-0">Edit Vehicle Information</h3>
                <button
                  onClick={() => setIsEditingMetadata(false)}
                  className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-radar-bg hover:bg-radar-border border border-radar-border cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch(`${API_BASE}/api/vehicles/${selectedVehicleId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: editName,
                      plateNumber: editPlate,
                      vehicleType: editType,
                      rentStatus: editRentStatus,
                      odometer: editOdometer,
                      nextOilChange: editNextOil,
                      taxDueDate: editTaxDue || null
                    })
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setVehicles(prev => prev.map(v => v.id === selectedVehicleId ? { ...v, ...updated } : v));
                    alert("Vehicle metadata updated successfully!");
                    setIsEditingMetadata(false);
                  } else {
                    const errData = await res.json();
                    alert(`Error: ${errData.error}`);
                  }
                } catch (err: any) {
                  alert(`Update failed: ${err.message}`);
                }
              }} className="space-y-3 text-slate-300">
                <div>
                  <label className="block text-slate-400 mb-1">Vehicle Name:</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-radar-bg border border-radar-border rounded p-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Plate Number:</label>
                    <input
                      type="text"
                      value={editPlate}
                      onChange={e => setEditPlate(e.target.value)}
                      className="w-full bg-radar-bg border border-radar-border rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Vehicle Type:</label>
                    <input
                      type="text"
                      value={editType}
                      onChange={e => setEditType(e.target.value)}
                      placeholder="e.g. Toyota Avanza"
                      className="w-full bg-radar-bg border border-radar-border rounded p-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Odometer (km):</label>
                    <input
                      type="number"
                      step="any"
                      value={editOdometer}
                      onChange={e => setEditOdometer(e.target.value)}
                      className="w-full bg-radar-bg border border-radar-border rounded p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Next Oil Change (km):</label>
                    <input
                      type="number"
                      step="any"
                      value={editNextOil}
                      onChange={e => setEditNextOil(e.target.value)}
                      className="w-full bg-radar-bg border border-radar-border rounded p-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Rent Status:</label>
                    <select
                      value={editRentStatus}
                      onChange={e => setEditRentStatus(e.target.value)}
                      className="w-full bg-radar-bg border border-radar-border rounded p-2 text-white"
                    >
                      <option value="available">Available</option>
                      <option value="rented">Rented</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Tax Due Date:</label>
                    <input
                      type="date"
                      value={editTaxDue}
                      onChange={e => setEditTaxDue(e.target.value)}
                      className="w-full bg-radar-bg border border-radar-border rounded p-2 text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 bg-radar-primary hover:bg-radar-primary-hover text-white font-bold py-2 rounded transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Info Modal / System Guidelines */}
      {isInfoOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-radar-surface border border-radar-border w-full max-w-md p-6 rounded-2xl shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-radar-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-radar-primary" />
                <h3 className="font-bold text-white text-base m-0">System Parameters</h3>
              </div>
              <button
                onClick={() => setIsInfoOpen(false)}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-radar-bg hover:bg-radar-border transition-all border border-radar-border cursor-pointer"
                aria-label="Close information modal"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
              <div>
                <h4 className="text-xs font-bold text-radar-red uppercase tracking-wider mb-1">1. Overspeeding Limit</h4>
                <p className="m-0 text-slate-400">
                  Vehicles exceeding a speed threshold of <strong className="text-white font-mono">80.0 km/h</strong> trigger a high-severity <strong className="text-radar-red">Overspeeding Alarm</strong>, broadcast to all active consoles.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-radar-amber uppercase tracking-wider mb-1">2. Geofence Violations</h4>
                <p className="m-0 text-slate-400">
                  Zone transition rules trigger alerts when a vehicle crosses a geofence circular boundary (e.g. entering a zone triggers <strong className="text-radar-green font-semibold">Geofence Entry</strong>; leaving triggers <strong className="text-radar-amber font-semibold">Geofence Exit</strong>).
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-radar-primary uppercase tracking-wider mb-1">3. Live SSE Ingestion</h4>
                <p className="m-0 text-slate-400">
                  Telemetry logs are ingested, saved to PostgreSQL via Drizzle ORM, and broadcast dynamically via Server-Sent Events (SSE).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded slide-in animation styles */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
