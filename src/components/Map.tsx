import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { StopArrivalsDrawer } from './StopArrivalsDrawer';
import { useTheme } from 'next-themes';

// Fix for default markers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Calculate distance between two coordinates in km using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

interface MapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  destination?: string;
  onRouteCalculated?: (duration: string, distance: string) => void;
}

export interface MapRef {
  centerOnUser: () => void;
}

const Map = forwardRef<MapRef, MapProps>(({ 
  center = { lat: 47.1585, lng: 27.6014 }, 
  zoom = 13,
  destination,
  onRouteCalculated 
}, ref) => {
  const { theme } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayer = useRef<L.Polyline | null>(null);
  const vehicleRouteLayer = useRef<L.Polyline | null>(null);
  const vehicleMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const stopMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const [transitData, setTransitData] = useState<any>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_DISTANCE_KM = 1; // Only show vehicles within 1km
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<any>(null);
  const [isStopDrawerOpen, setIsStopDrawerOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const selectedRouteLayer = useRef<L.Polyline | null>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    centerOnUser: () => {
      if (map.current) {
        map.current.setView([center.lat, center.lng], 15, {
          animate: true,
          duration: 0.5,
        });
      }
    },
  }));

  // Draw selected route from stop arrivals menu
  useEffect(() => {
    if (!map.current || !selectedRoute) return;

    // Remove existing route
    if (selectedRouteLayer.current) {
      map.current.removeLayer(selectedRouteLayer.current);
    }

    if (selectedRoute.shapes && selectedRoute.shapes.length > 0) {
      const routeColor = selectedRoute.route_color ? `#${selectedRoute.route_color}` : 
                        (selectedRoute.route_type === 0 ? '#8B5CF6' : '#3B82F6');
      
      selectedRouteLayer.current = L.polyline(
        selectedRoute.shapes.map((point: any) => [point.lat, point.lon]),
        {
          color: routeColor,
          weight: 5,
          opacity: 0.8,
        }
      ).addTo(map.current);

      // Fit map to route bounds
      map.current.fitBounds(selectedRouteLayer.current.getBounds(), {
        padding: [50, 50],
      });
    }

    return () => {
      if (selectedRouteLayer.current && map.current) {
        map.current.removeLayer(selectedRouteLayer.current);
        selectedRouteLayer.current = null;
      }
    };
  }, [selectedRoute]);

  // Draw vehicle route when vehicle is selected
  useEffect(() => {
    if (!map.current || !selectedVehicle || !transitData?.routes) return;

    // Find the route for this vehicle
    const route = transitData.routes.find((r: any) => r.route_id === selectedVehicle.routeId);
    
    if (route && route.shapes && route.shapes.length > 0) {
      // Remove existing vehicle route
      if (vehicleRouteLayer.current) {
        map.current.removeLayer(vehicleRouteLayer.current);
      }

      // Get the route color
      const routeColor = selectedVehicle.vehicle_type === 0 ? '#8B5CF6' : '#3B82F6';

      // Draw the vehicle route
      vehicleRouteLayer.current = L.polyline(
        route.shapes.map((point: any) => [point.lat, point.lon]),
        {
          color: routeColor,
          weight: 4,
          opacity: 0.7,
        }
      ).addTo(map.current);
    }

    return () => {
      if (vehicleRouteLayer.current && map.current) {
        map.current.removeLayer(vehicleRouteLayer.current);
        vehicleRouteLayer.current = null;
      }
    };
  }, [selectedVehicle, transitData]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Initialize tile layer based on theme
    const tileUrl = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    
    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map.current);

    // Add custom user location marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative">
          <div class="absolute w-8 h-8 rounded-full bg-primary/30 animate-ping"></div>
          <div class="relative w-8 h-8 rounded-full glass-strong flex items-center justify-center border-2 border-primary">
            <div class="w-3 h-3 rounded-full bg-primary"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([center.lat, center.lng], { icon: userIcon }).addTo(map.current);

    // Cleanup
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      vehicleMarkersRef.current.forEach(marker => marker.remove());
      vehicleMarkersRef.current.clear();
      stopMarkersRef.current.forEach(marker => marker.remove());
      stopMarkersRef.current.clear();
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
      }
      map.current?.remove();
      map.current = null;
    };
  }, [center.lat, center.lng, zoom, theme]);

  // Update tile layer when theme changes
  useEffect(() => {
    if (!map.current || !tileLayerRef.current) return;

    const tileUrl = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    // Remove old tile layer
    tileLayerRef.current.remove();

    // Add new tile layer with updated theme
    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map.current);
  }, [theme]);

  // Fetch transit data every 30 seconds
  useEffect(() => {
    const fetchTransitData = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/get-transit-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTransitData(data);
        }
      } catch (error) {
        console.error('Error fetching transit data:', error);
      }
    };

    // Initial fetch
    fetchTransitData();

    // Set up interval for updates every 30 seconds
    const interval = setInterval(fetchTransitData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Optimized marker update with distance filtering and throttling
  const updateMarkers = useCallback(() => {
    if (!map.current || !transitData) return;

    // Throttle updates for smooth performance
    if (updateTimeoutRef.current) return;
    
    updateTimeoutRef.current = setTimeout(() => {
      updateTimeoutRef.current = null;
    }, 100); // Throttle to max 10 updates per second

    requestAnimationFrame(() => {
      const currentVehicleIds = new Set<string>();
      const currentStopIds = new Set<string>();

      // Filter and update vehicle markers within 1km radius
      // If a route is selected, only show vehicles on that route
      const filteredVehicles = selectedRoute 
        ? transitData.vehicles?.filter((v: any) => v.routeId === selectedRoute.route_id)
        : transitData.vehicles;

      filteredVehicles?.forEach((vehicle: any) => {
        // Validate coordinates
        if (!vehicle.latitude || !vehicle.longitude || 
            typeof vehicle.latitude !== 'number' || 
            typeof vehicle.longitude !== 'number') {
          return;
        }

        // Filter out vehicles in depot (not moving or inactive)
        if (!vehicle.speed || vehicle.speed < 2) {
          return;
        }

        // Filter out vehicles with no recent activity (older than 15 minutes)
        if (vehicle.timestamp) {
          const vehicleTime = new Date(vehicle.timestamp).getTime();
          const currentTime = Date.now();
          const fifteenMinutesInMs = 15 * 60 * 1000;
          
          if (currentTime - vehicleTime > fifteenMinutesInMs) {
            return;
          }
        }

        // Calculate distance from user location
        const distance = calculateDistance(
          center.lat, 
          center.lng, 
          vehicle.latitude, 
          vehicle.longitude
        );

        // Skip if beyond 1km radius
        if (distance > MAX_DISTANCE_KM) {
          return;
        }

        const vehicleId = vehicle.id || `${vehicle.routeShortName}-${vehicle.latitude}-${vehicle.longitude}`;
        currentVehicleIds.add(vehicleId);

        const existingMarker = vehicleMarkersRef.current.get(vehicleId);

        if (existingMarker) {
          // Update existing marker position smoothly
          existingMarker.setLatLng([vehicle.latitude, vehicle.longitude]);
        } else {
          // Create new marker - determine color based on vehicle type
          const routeInfo = transitData.routes?.find((r: any) => r.route_id === vehicle.routeId);
          // Tramvai = mov (#8B5CF6), Autobuz = albastru (#3B82F6)
          const vehicleColor = vehicle.vehicle_type === 0 ? '#8B5CF6' : '#3B82F6';
          const routeNumber = vehicle.label || routeInfo?.route_short_name || '?';
          const isAccessible = vehicle.wheelchair_accessible === 'WHEELCHAIR_ACCESSIBLE';
          
          const vehicleIcon = L.divIcon({
            className: 'custom-vehicle-marker',
            html: `
              <div class="relative cursor-pointer group">
                <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl" 
                     style="background: linear-gradient(135deg, ${vehicleColor}dd, ${vehicleColor}ff);">
                  <span class="text-white font-bold text-sm drop-shadow-lg">${routeNumber}</span>
                </div>
                ${isAccessible ? '<div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"><span class="text-white text-[10px]">♿</span></div>' : ''}
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          });

          const marker = L.marker([vehicle.latitude, vehicle.longitude], { 
            icon: vehicleIcon,
            rotationAngle: vehicle.bearing || 0,
          }).addTo(map.current!);

          // Add click event to show vehicle details
          marker.on('click', () => {
            // Find route info for this vehicle - vehicle has routeId from formatting
            const routeInfo = transitData.routes?.find((r: any) => r.route_id === vehicle.routeId);
            setSelectedVehicle({ ...vehicle, routeInfo });
            setIsVehicleDialogOpen(true);
          });

          vehicleMarkersRef.current.set(vehicleId, marker);
        }
      });

      // Remove markers that are no longer in data or out of range
      vehicleMarkersRef.current.forEach((marker, id) => {
        if (!currentVehicleIds.has(id)) {
          marker.remove();
          vehicleMarkersRef.current.delete(id);
        }
      });

      // Filter stops within 1km radius (show max 30 for performance)
      const nearbyStops = transitData.stops
        ?.filter((stop: any) => {
          if (!stop.latitude || !stop.longitude || 
              typeof stop.latitude !== 'number' || 
              typeof stop.longitude !== 'number') {
            return false;
          }

          const distance = calculateDistance(
            center.lat, 
            center.lng, 
            stop.latitude, 
            stop.longitude
          );

          return distance <= MAX_DISTANCE_KM;
        })
        .slice(0, 30) || [];

      nearbyStops.forEach((stop: any) => {
        const stopId = stop.id || `${stop.code}-${stop.latitude}-${stop.longitude}`;
        currentStopIds.add(stopId);

        const existingMarker = stopMarkersRef.current.get(stopId);

        if (!existingMarker) {
          const stopIcon = L.divIcon({
            className: 'custom-stop-marker',
            html: `
              <div class="w-3 h-3 rounded-full bg-accent border-2 border-background transition-all duration-300"></div>
            `,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          });

          const marker = L.marker([stop.latitude, stop.longitude], { 
            icon: stopIcon,
          })
            .bindPopup(`<b>${stop.name}</b>`)
            .addTo(map.current!);

          // Add click event to show stop arrivals drawer
          marker.on('click', () => {
            setSelectedStop(stop);
            setIsStopDrawerOpen(true);
            // Clear selected vehicle and route
            setSelectedVehicle(null);
            setIsVehicleDialogOpen(false);
            setSelectedRoute(null);
            if (vehicleRouteLayer.current) {
              map.current?.removeLayer(vehicleRouteLayer.current);
            }
            if (selectedRouteLayer.current) {
              map.current?.removeLayer(selectedRouteLayer.current);
            }
          });

          stopMarkersRef.current.set(stopId, marker);
        }
      });

      // Remove stop markers that are out of range
      stopMarkersRef.current.forEach((marker, id) => {
        if (!currentStopIds.has(id)) {
          marker.remove();
          stopMarkersRef.current.delete(id);
        }
      });
    });
  }, [transitData, center, selectedRoute]);

  // Update markers when transit data changes
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Calculate route using Google Maps API when destination changes
  useEffect(() => {
    if (!map.current || !destination) {
      // Remove existing route if no destination
      if (routeLayer.current) {
        map.current?.removeLayer(routeLayer.current);
        routeLayer.current = null;
      }
      return;
    }

    const calculateRoute = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/calculate-route`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origin: center,
            destination: destination,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate route');
        }

        const data = await response.json();

        if (data.route && data.route.length > 0) {
          // Remove existing route
          if (routeLayer.current) {
            map.current?.removeLayer(routeLayer.current);
          }

          // Draw new route on Leaflet map
          routeLayer.current = L.polyline(data.route, {
            color: '#8B5CF6',
            weight: 5,
            opacity: 0.8,
          }).addTo(map.current!);

          // Fit map to route bounds
          map.current?.fitBounds(routeLayer.current.getBounds(), {
            padding: [50, 50],
          });

          // Add destination marker
          const destIcon = L.divIcon({
            className: 'custom-dest-marker',
            html: `
              <div class="relative">
                <div class="w-10 h-10 rounded-full glass-card border-2 border-primary flex items-center justify-center">
                  <span class="text-xl">📍</span>
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          });

          L.marker(data.route[data.route.length - 1], { icon: destIcon }).addTo(map.current!);

          // Call callback with route info
          if (onRouteCalculated && data.duration && data.distance) {
            onRouteCalculated(data.duration, data.distance);
          }
        }
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    };

    calculateRoute();
  }, [destination, center, onRouteCalculated]);

  return (
    <>
      <style>{`
        .custom-user-marker,
        .custom-vehicle-marker,
        .custom-stop-marker,
        .custom-dest-marker {
          background: transparent;
          border: none;
        }
        .leaflet-container {
          background: transparent;
        }
      `}</style>
      <div ref={mapContainer} className="absolute inset-0 z-0" />

      {/* Vehicle Details Drawer */}
      <Drawer open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DrawerContent className="glass-card backdrop-blur-xl border-0 max-h-[60vh] rounded-t-[2rem]">
          <DrawerHeader className="text-center border-b border-white/10 pb-6">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <DrawerTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
              {selectedVehicle?.vehicle_type === 0 ? '🚊 Tramvai' : '🚍 Autobuz'}
              {selectedVehicle?.label && <span className="text-primary">#{selectedVehicle.label}</span>}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-4 space-y-4">
            {selectedVehicle?.routeInfo && (
              <div className="glass-strong rounded-3xl p-5 border-l-[5px] shadow-lg" style={{ 
                borderColor: selectedVehicle.vehicle_type === 0 ? '#8B5CF6' : '#3B82F6',
                background: selectedVehicle.vehicle_type === 0 ? 'linear-gradient(135deg, #8B5CF605, transparent)' : 'linear-gradient(135deg, #3B82F605, transparent)'
              }}>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Traseu</p>
                <p className="text-2xl font-bold">{selectedVehicle.routeInfo.route_short_name}</p>
                <p className="text-sm text-muted-foreground mt-2">{selectedVehicle.routeInfo.route_long_name}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass-strong rounded-3xl p-5 shadow-lg">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Viteză</p>
                <p className="text-3xl font-bold text-primary">{selectedVehicle?.speed || 0} <span className="text-lg">km/h</span></p>
              </div>
              <div className="glass-strong rounded-3xl p-5 shadow-lg">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Următoarea stație</p>
                <p className="text-sm font-semibold">{selectedVehicle?.next_stop_name || 'Necunoscut'}</p>
              </div>
            </div>
            {selectedVehicle?.wheelchair_accessible === 'WHEELCHAIR_ACCESSIBLE' && (
              <div className="glass-strong rounded-3xl p-4 flex items-center gap-3 bg-green-500/10 border border-green-500/20 shadow-lg mb-6">
                <div className="w-10 h-10 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <span className="text-2xl">♿</span>
                </div>
                <span className="text-sm font-medium text-green-400">Accesibil pentru persoane cu dizabilități</span>
              </div>
            )}
            
            {/* Modern footer with decorative divider */}
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                  <span>Date în timp real</span>
                </div>
                {selectedVehicle?.timestamp && (
                  <>
                    <span className="text-muted-foreground/30">•</span>
                    <span>Actualizat {new Date(selectedVehicle.timestamp).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Stop Arrivals Drawer */}
      <StopArrivalsDrawer
        open={isStopDrawerOpen}
        onOpenChange={setIsStopDrawerOpen}
        selectedStop={selectedStop}
        transitData={transitData}
        onRouteSelect={(route) => {
          setSelectedRoute(route);
          setSelectedStop(null);
        }}
      />
    </>
  );
});

Map.displayName = 'Map';

export default Map;
