import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle, memo } from 'react';
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
  const mapBoundsRef = useRef<L.LatLngBounds | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<any>(null);
  const [isStopDrawerOpen, setIsStopDrawerOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const selectedRouteLayer = useRef<L.Polyline | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filteredRoutes, setFilteredRoutes] = useState<string[]>([]); // Multiple route IDs

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
    console.log('🗺️ Selected route changed:', selectedRoute?.route_short_name || 'none');
    
    if (!map.current || !selectedRoute) {
      console.log('🗺️ Map or selectedRoute not available');
      return;
    }

    // Remove existing route
    if (selectedRouteLayer.current) {
      console.log('🗺️ Removing existing route layer');
      map.current.removeLayer(selectedRouteLayer.current);
    }

    console.log('🗺️ Route shapes count:', selectedRoute.shapes?.length || 0);
    console.log('🗺️ Route data:', selectedRoute);

    if (selectedRoute.shapes && selectedRoute.shapes.length > 0) {
      // Use purple color for the selected route polyline
      const routeColor = '#8B5CF6'; // Purple color for selected routes
      
      console.log('🗺️ Drawing route with color:', routeColor);
      
      selectedRouteLayer.current = L.polyline(
        selectedRoute.shapes.map((point: any) => [point.lat, point.lon]),
        {
          color: routeColor,
          weight: 6,
          opacity: 0.9,
        }
      ).addTo(map.current);

      console.log('🗺️ Route drawn successfully');

      // Fit map to route bounds
      map.current.fitBounds(selectedRouteLayer.current.getBounds(), {
        padding: [50, 50],
      });
    } else {
      console.log('🗺️ No shapes available for route');
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
    if (!map.current || !selectedVehicle || !transitData) return;

    // Find the trip for this vehicle using the route_id
    const tripId = transitData.routeToTripMap?.[selectedVehicle.routeId];
    
    if (!tripId) {
      console.log('No trip found for vehicle route:', selectedVehicle.routeId);
      return;
    }

    // Find the trip to get the shape_id
    const trip = transitData.trips?.find((t: any) => t.trip_id === tripId);
    
    if (!trip || !trip.shape_id) {
      console.log('No trip or shape_id found for trip:', tripId);
      return;
    }

    // Find the route to get the shapes for this shape_id
    const route = transitData.routes?.find((r: any) => 
      r.shape_id === trip.shape_id && r.route_id === selectedVehicle.routeId
    );
    
    if (route && route.shapes && route.shapes.length > 0) {
      // Remove existing vehicle route
      if (vehicleRouteLayer.current) {
        map.current.removeLayer(vehicleRouteLayer.current);
      }

      // Get the route color based on vehicle type
      const routeColor = selectedVehicle.vehicle_type === 0 ? '#8B5CF6' : '#3B82F6';

      // Draw the vehicle route as a smooth polyline
      vehicleRouteLayer.current = L.polyline(
        route.shapes.map((point: any) => [point.lat, point.lon]),
        {
          color: routeColor,
          weight: 4,
          opacity: 0.7,
          smoothFactor: 1,
        }
      ).addTo(map.current);

      console.log(`✅ Drew route for trip ${tripId} with ${route.shapes.length} points`);
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

    // Add map move event listener for viewport updates
    let moveTimeout: NodeJS.Timeout;
    map.current.on('moveend', () => {
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        updateMapBounds();
        updateMarkers();
      }, 300);
    });

    // Cleanup
    return () => {
      clearTimeout(moveTimeout);
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

  // Debounced update of map bounds
  const updateMapBounds = useCallback(() => {
    if (map.current) {
      mapBoundsRef.current = map.current.getBounds();
    }
  }, []);

  // Fetch transit data with viewport filtering
  const fetchTransitData = useCallback(async () => {
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
  }, []);

  // Initial data fetch and periodic updates
  useEffect(() => {
    fetchTransitData();
    const interval = setInterval(fetchTransitData, 30000);
    return () => clearInterval(interval);
  }, [fetchTransitData]);

  // Check if a point is within current viewport
  const isInViewport = useCallback((lat: number, lng: number): boolean => {
    if (!mapBoundsRef.current) return true;
    return mapBoundsRef.current.contains([lat, lng]);
  }, []);

  // Optimized marker update with viewport filtering
  const updateMarkers = useCallback(() => {
    if (!map.current || !transitData) return;

    // Throttle updates
    if (updateTimeoutRef.current) return;
    updateTimeoutRef.current = setTimeout(() => {
      updateTimeoutRef.current = null;
    }, 200);

    requestAnimationFrame(() => {
      const currentVehicleIds = new Set<string>();
      const currentStopIds = new Set<string>();

      // Get current map bounds
      updateMapBounds();

      // Filter vehicles: by route if selected, by viewport always
      const activeRouteFilter = selectedRoute ? selectedRoute.route_id : null;
      const hasManualFilters = filteredRoutes.length > 0;
      
      const filteredVehicles = transitData.vehicles?.filter((v: any) => {
        // If a route is selected from stop drawer, show only that route
        if (activeRouteFilter) {
          return v.routeId === activeRouteFilter;
        }
        // If manual filters are active, show only filtered routes
        if (hasManualFilters) {
          return filteredRoutes.includes(v.routeId?.toString());
        }
        // Otherwise show all
        return true;
      });

      filteredVehicles?.forEach((vehicle: any) => {
        // Validate coordinates
        if (!vehicle.latitude || !vehicle.longitude || 
            typeof vehicle.latitude !== 'number' || 
            typeof vehicle.longitude !== 'number') {
          return;
        }

        // Filter out vehicles with no recent activity (older than 30 minutes)
        if (vehicle.timestamp) {
          const vehicleTime = new Date(vehicle.timestamp).getTime();
          const currentTime = Date.now();
          const thirtyMinutesInMs = 30 * 60 * 1000;
          
          if (currentTime - vehicleTime > thirtyMinutesInMs) {
            return;
          }
        }

        // Skip if not in viewport AND not on selected route
        if (!isInViewport(vehicle.latitude, vehicle.longitude) && !selectedRoute) {
          return;
        }

        const vehicleId = vehicle.id || `${vehicle.routeShortName}-${vehicle.latitude}-${vehicle.longitude}`;
        
        // Check route number before adding to current set
        const routeInfo = transitData.routes?.find((r: any) => r.route_id === vehicle.routeId);
        const routeNumber = vehicle.label || routeInfo?.route_short_name || '?';
        
        // Don't render vehicles with "?" as route number
        if (routeNumber === '?') {
          // Remove if it exists
          const existingMarker = vehicleMarkersRef.current.get(vehicleId);
          if (existingMarker) {
            existingMarker.remove();
            vehicleMarkersRef.current.delete(vehicleId);
          }
          return;
        }
        
        currentVehicleIds.add(vehicleId);

        const existingMarker = vehicleMarkersRef.current.get(vehicleId);

        if (existingMarker) {
          // Update existing marker position smoothly
          existingMarker.setLatLng([vehicle.latitude, vehicle.longitude]);
        } else {
          // Create new marker - determine color based on vehicle type
          // Tramvai = mov (#8B5CF6), Autobuz = albastru (#3B82F6)
          const vehicleColor = vehicle.vehicle_type === 0 ? '#8B5CF6' : '#3B82F6';
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

          marker.on('click', () => {
            // Find route info for this vehicle - vehicle has routeId from formatting
            const routeInfo = transitData.routes?.find((r: any) => r.route_id === vehicle.routeId);
            
            // Find trip for this vehicle's route
            const tripId = transitData.routeToTripMap?.[vehicle.routeId];
            let nextStopName = 'Necunoscut';
            
            if (tripId && transitData.tripStopSequences?.[tripId] && routeInfo?.shapes && routeInfo.shapes.length > 1) {
              // Get stop sequence for this trip
              const stopSequence = transitData.tripStopSequences[tripId];
              
              // Find closest shape point to vehicle
              let closestShapeIdx = 0;
              let minDist = Infinity;
              
              routeInfo.shapes.forEach((point: any, idx: number) => {
                const dist = calculateDistance(
                  vehicle.latitude,
                  vehicle.longitude,
                  point.lat,
                  point.lon
                );
                if (dist < minDist) {
                  minDist = dist;
                  closestShapeIdx = idx;
                }
              });
              
              // Determine vehicle direction by comparing with next/previous shape points
              // Calculate bearing/direction to understand if moving forward or backward on route
              let isMovingForward = true;
              
              if (closestShapeIdx > 0 && closestShapeIdx < routeInfo.shapes.length - 1) {
                const prevPoint = routeInfo.shapes[closestShapeIdx - 1];
                const nextPoint = routeInfo.shapes[closestShapeIdx + 1];
                
                // Calculate distances to previous and next points
                const distToPrev = calculateDistance(
                  vehicle.latitude,
                  vehicle.longitude,
                  prevPoint.lat,
                  prevPoint.lon
                );
                
                const distToNext = calculateDistance(
                  vehicle.latitude,
                  vehicle.longitude,
                  nextPoint.lat,
                  nextPoint.lon
                );
                
                // If we're closer to previous point than next, we're likely moving backward
                // Also consider vehicle speed - if speed is > 0, use bearing direction
                if (vehicle.speed > 5) {
                  // For vehicles with good speed, assume forward movement
                  isMovingForward = distToNext <= distToPrev;
                }
              }
              
              console.log(`🚌 Vehicle ${vehicle.id} at shape index ${closestShapeIdx}, moving ${isMovingForward ? 'forward' : 'backward'}`);
              
              // Find the next stop based on direction
              let foundNextStop = false;
              
              if (isMovingForward) {
                // Moving forward in sequence - find next stop ahead
                for (const stopInSequence of stopSequence) {
                  const stop = transitData.stops?.find((s: any) => s.id === stopInSequence.stopId);
                  if (!stop) continue;
                  
                  // Find closest shape point to this stop
                  let closestStopIdx = 0;
                  let minStopDist = Infinity;
                  
                  routeInfo.shapes.forEach((point: any, idx: number) => {
                    const dist = calculateDistance(
                      stop.latitude,
                      stop.longitude,
                      point.lat,
                      point.lon
                    );
                    if (dist < minStopDist) {
                      minStopDist = dist;
                      closestStopIdx = idx;
                    }
                  });
                  
                  // If this stop is ahead of the vehicle
                  if (closestStopIdx > closestShapeIdx + 5) { // Add some buffer to avoid current stop
                    nextStopName = stop.name;
                    foundNextStop = true;
                    console.log(`✅ Next stop (forward): ${nextStopName}`);
                    break;
                  }
                }
              } else {
                // Moving backward in sequence - find previous stop
                for (let i = stopSequence.length - 1; i >= 0; i--) {
                  const stopInSequence = stopSequence[i];
                  const stop = transitData.stops?.find((s: any) => s.id === stopInSequence.stopId);
                  if (!stop) continue;
                  
                  // Find closest shape point to this stop
                  let closestStopIdx = 0;
                  let minStopDist = Infinity;
                  
                  routeInfo.shapes.forEach((point: any, idx: number) => {
                    const dist = calculateDistance(
                      stop.latitude,
                      stop.longitude,
                      point.lat,
                      point.lon
                    );
                    if (dist < minStopDist) {
                      minStopDist = dist;
                      closestStopIdx = idx;
                    }
                  });
                  
                  // If this stop is behind the vehicle (in reverse direction)
                  if (closestStopIdx < closestShapeIdx - 5) { // Add buffer
                    nextStopName = stop.name;
                    foundNextStop = true;
                    console.log(`✅ Next stop (backward): ${nextStopName}`);
                    break;
                  }
                }
              }
              
              if (!foundNextStop) {
                console.log('⚠️ Could not determine next stop');
              }
            }
            
            setSelectedVehicle({ ...vehicle, routeInfo, next_stop_name: nextStopName });
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

      // Filter stops by viewport and selected route
      let nearbyStops = transitData.stops
        ?.filter((stop: any) => {
          if (!stop.latitude || !stop.longitude || 
              typeof stop.latitude !== 'number' || 
              typeof stop.longitude !== 'number') {
            return false;
          }

          return isInViewport(stop.latitude, stop.longitude);
        }) || [];

      // If a route is selected from stop drawer or manual filters, only show stops for those routes
      const activeFilters = selectedRoute 
        ? [selectedRoute.route_id] 
        : (filteredRoutes.length > 0 ? filteredRoutes : null);
        
      if (activeFilters && transitData.tripStopSequences) {
        const routeStopIds = new Set<number>();
        
        // Find all trips for filtered routes and collect their stop IDs
        Object.entries(transitData.tripStopSequences).forEach(([tripId, sequence]: [string, any]) => {
          const trip = transitData.trips?.find((t: any) => t.trip_id === tripId);
          if (trip && activeFilters.includes(trip.route_id?.toString())) {
            sequence.forEach((stopSeq: any) => {
              routeStopIds.add(stopSeq.stopId);
            });
          }
        });
        
        // Filter to only stops that are part of filtered routes
        nearbyStops = nearbyStops.filter((stop: any) => routeStopIds.has(stop.id));
      }
      
      nearbyStops = nearbyStops.slice(0, 50); // Show more stops when route is selected

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
            setSelectedVehicle(null);
            setIsVehicleDialogOpen(false);
            // Don't clear selected route when clicking a stop on that route
            if (vehicleRouteLayer.current) {
              map.current?.removeLayer(vehicleRouteLayer.current);
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
  }, [transitData, selectedRoute, isInViewport, updateMapBounds, filteredRoutes]);

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

      {/* Filter Button - Always visible */}
      <button
        onClick={() => setIsFilterDrawerOpen(true)}
        className={`absolute bottom-28 left-4 w-11 h-11 glass-card backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/10 group hover:bg-primary/20 transition-all hover:scale-110 ${
          isFilterDrawerOpen || isStopDrawerOpen || isVehicleDialogOpen ? 'z-40' : 'z-[500]'
        }`}
        aria-label="Open filters"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-primary group-hover:scale-110 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        {/* Active filter indicator */}
        {(selectedRoute || filteredRoutes.length > 0) && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
        )}
      </button>

      {/* Vehicle Details Drawer */}
      <Drawer open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
        <DrawerContent className="glass-card backdrop-blur-xl border-0 max-h-[60vh] rounded-t-[2rem]" aria-describedby="vehicle-details-description">
          <DrawerHeader className="text-center border-b border-white/10 pb-6">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <DrawerTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
              {selectedVehicle?.vehicle_type === 0 ? '🚊 Tramvai' : '🚍 Autobuz'}
              {selectedVehicle?.label && <span className="text-primary">#{selectedVehicle.label}</span>}
            </DrawerTitle>
          </DrawerHeader>
          <div id="vehicle-details-description" className="px-6 pb-4 space-y-4">
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

      {/* Filter Drawer */}
      <Drawer open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
        <DrawerContent className="glass-card backdrop-blur-xl border-0 max-h-[80vh] rounded-t-[2rem]" aria-describedby="filter-description">
          <DrawerHeader className="text-center border-b border-white/10 pb-6">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <DrawerTitle className="text-2xl font-bold">
              Filtre Harta
            </DrawerTitle>
          </DrawerHeader>
          <div id="filter-description" className="px-6 pb-8 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Active Route from Stop Selection */}
            {selectedRoute && (
              <div className="glass-strong rounded-3xl p-5 border-l-[5px] shadow-lg mb-4" style={{ 
                borderColor: '#8B5CF6',
                background: 'linear-gradient(135deg, #8B5CF605, transparent)'
              }}>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Rută din Stație</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary">{selectedRoute.route_short_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedRoute.route_long_name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRoute(null);
                      if (selectedRouteLayer.current && map.current) {
                        map.current.removeLayer(selectedRouteLayer.current);
                        selectedRouteLayer.current = null;
                      }
                      setTimeout(() => {
                        if (updateTimeoutRef.current) {
                          clearTimeout(updateTimeoutRef.current);
                          updateTimeoutRef.current = null;
                        }
                        updateMarkers();
                      }, 100);
                    }}
                    className="text-destructive hover:scale-110 transition-transform"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Manual Route Filters */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">Filtrează Rute</p>
                {filteredRoutes.length > 0 && (
                  <button
                    onClick={() => {
                      setFilteredRoutes([]);
                      setTimeout(() => {
                        if (updateTimeoutRef.current) {
                          clearTimeout(updateTimeoutRef.current);
                          updateTimeoutRef.current = null;
                        }
                        updateMarkers();
                      }, 100);
                    }}
                    className="text-xs text-destructive hover:underline"
                  >
                    Șterge Tot ({filteredRoutes.length})
                  </button>
                )}
              </div>

              {/* Route list */}
              <div className="grid grid-cols-4 gap-2">
                {transitData?.routes
                  ?.filter((route: any) => route.route_short_name && route.route_short_name !== '?')
                  ?.sort((a: any, b: any) => {
                    const aNum = parseInt(a.route_short_name);
                    const bNum = parseInt(b.route_short_name);
                    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                    return a.route_short_name.localeCompare(b.route_short_name);
                  })
                  ?.slice(0, 100) // Limit to first 100 routes
                  ?.map((route: any) => {
                    const isSelected = filteredRoutes.includes(route.route_id?.toString());
                    const routeColor = route.route_type === 0 ? '#8B5CF6' : '#3B82F6';
                    
                    return (
                      <button
                        key={route.route_id}
                        onClick={() => {
                          setFilteredRoutes(prev => {
                            const routeIdStr = route.route_id?.toString();
                            const newFilters = prev.includes(routeIdStr)
                              ? prev.filter(id => id !== routeIdStr)
                              : [...prev, routeIdStr];
                            
                            // Trigger update after state change
                            setTimeout(() => {
                              if (updateTimeoutRef.current) {
                                clearTimeout(updateTimeoutRef.current);
                                updateTimeoutRef.current = null;
                              }
                              updateMarkers();
                            }, 100);
                            
                            return newFilters;
                          });
                        }}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all text-white font-bold text-sm ${
                          isSelected 
                            ? 'ring-2 ring-primary scale-105 shadow-lg' 
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{
                          background: isSelected 
                            ? `linear-gradient(135deg, ${routeColor}dd, ${routeColor}ff)`
                            : `linear-gradient(135deg, ${routeColor}66, ${routeColor}88)`
                        }}
                      >
                        <span className="text-base">{route.route_type === 0 ? '🚊' : '🚍'}</span>
                        <span className="text-xs mt-0.5">{route.route_short_name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {filteredRoutes.length === 0 && !selectedRoute && (
              <p className="text-center text-muted-foreground text-sm py-4">
                Selectează rutele pentru a filtra vehiculele
              </p>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
});

Map.displayName = 'Map';

// Memoize the component to prevent unnecessary re-renders
export default memo(Map);
