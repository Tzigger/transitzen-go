import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MapPin, Navigation as NavigationIcon, Layers, Search } from "lucide-react";
import AppNavigation from "@/components/Navigation";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom marker icons
const busIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const stopIcon = new Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
});

const MapView = () => {
  // Iași city center coordinates
  const center: [number, number] = [47.1585, 27.6014];

  // Mock bus locations
  const buses = [
    { id: 1, position: [47.1585, 27.6014] as [number, number], route: "28", destination: "Copou", eta: "3 min" },
    { id: 2, position: [47.1650, 27.6100] as [number, number], route: "41", destination: "Podu Roș", eta: "7 min" },
    { id: 3, position: [47.1520, 27.5950] as [number, number], route: "13", destination: "Tătărași", eta: "12 min" },
  ];

  // Mock bus stops
  const stops = [
    { id: 1, position: [47.1600, 27.6050] as [number, number], name: "Piața Unirii" },
    { id: 2, position: [47.1550, 27.6000] as [number, number], name: "Teatrul Național" },
    { id: 3, position: [47.1630, 27.6120] as [number, number], name: "Copou" },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-8 md:pl-64">
      <AppNavigation />

      <main className="h-screen p-4 md:p-8 relative">
        {/* Search Bar */}
        <div className="absolute top-20 md:top-8 left-4 md:left-72 right-4 z-[1000]">
          <div className="neu-float rounded-2xl p-4 max-w-md">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for stops, routes..."
                className="flex-1 bg-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Floating Controls */}
        <div className="absolute top-40 md:top-24 right-4 z-[1000] space-y-2">
          <button className="neu-flat rounded-xl p-3 hover:neu-pressed transition-all block">
            <MapPin className="w-5 h-5" />
          </button>
          <button className="neu-flat rounded-xl p-3 hover:neu-pressed transition-all block">
            <NavigationIcon className="w-5 h-5" />
          </button>
          <button className="neu-flat rounded-xl p-3 hover:neu-pressed transition-all block">
            <Layers className="w-5 h-5" />
          </button>
        </div>

        {/* Map Container */}
        <div className="neu-pressed rounded-3xl overflow-hidden h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
          <MapContainer
            center={center}
            zoom={13}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Bus Markers */}
            {buses.map((bus) => (
              <Marker key={bus.id} position={bus.position} icon={busIcon}>
                <Popup>
                  <div className="p-2">
                    <p className="font-semibold text-primary">Bus {bus.route}</p>
                    <p className="text-sm">to {bus.destination}</p>
                    <p className="text-xs text-muted-foreground">ETA: {bus.eta}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Stop Markers */}
            {stops.map((stop) => (
              <Marker key={stop.id} position={stop.position} icon={stopIcon}>
                <Popup>
                  <div className="p-2">
                    <p className="font-semibold">{stop.name}</p>
                    <p className="text-xs text-muted-foreground">Bus Stop</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Bottom Info Card (Mobile) */}
        <div className="absolute bottom-24 md:bottom-8 left-4 right-4 z-[1000] md:hidden">
          <div className="neu-float rounded-2xl p-4">
            <p className="text-sm font-semibold mb-2">Nearby Buses</p>
            <div className="space-y-2">
              {buses.slice(0, 2).map((bus) => (
                <div key={bus.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bus {bus.route}</span>
                  <span className="font-semibold text-primary">{bus.eta}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MapView;
