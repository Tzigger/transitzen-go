import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle, memo, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { StopArrivalsDrawer } from './StopArrivalsDrawer';
import { useTheme } from 'next-themes';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

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

// MEMORY OPTIMIZATION: Cache for route shapes to avoid repeated fetching
const routeShapesCache: { [key: string]: any[] } = {};

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
  selectedVehicleTypes?: string[];
}

export interface MapRef {
  centerOnUser: () => void;
  drawJourneyRoute: (routeData: any) => void;
  clearJourneyRoute: () => void;
}

const Map = forwardRef<MapRef, MapProps>(({ 
  center = { lat: 47.1585, lng: 27.6014 }, 
  zoom = 13,
  destination,
  onRouteCalculated,
  selectedVehicleTypes = ['bus', 'tram']
}, ref) => {
  const { theme } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayer = useRef<L.Polyline | null>(null);
  const vehicleRouteLayer = useRef<L.Polyline | null>(null);
  const journeyRouteLayers = useRef<L.Layer[]>([]); // Pentru segmentele de călătorie (mers pe jos + transport)
  const vehicleClusterGroup = useRef<L.MarkerClusterGroup | null>(null);
  const vehicleMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const stopMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map());
  const userLocationMarker = useRef<L.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Use state for transit data (updated from viewport query)
  const [transitData, setTransitData] = useState<any>(null);
  
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapBoundsRef = useRef<L.LatLngBounds | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState<any>(null);
  const [isStopDrawerOpen, setIsStopDrawerOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [loadingRouteShapes, setLoadingRouteShapes] = useState(false);
  const selectedRouteLayer = useRef<L.Polyline | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filteredRoutes, setFilteredRoutes] = useState<string[]>([]); // Multiple route IDs
  const filteredRouteLayers = useRef<L.Polyline[]>([]); // Store multiple route polylines
  
  // Generate unique colors for multiple selected routes
  const routeColorPalette = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#FFD93D', // Yellow
    '#6BCF7F', // Green
    '#A78BFA', // Purple
    '#FB923C', // Orange
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#8B5CF6', // Violet
    '#3B82F6', // Blue
    '#EF4444', // Bright Red
    '#10B981', // Emerald
  ];
  
  const getRouteColor = useCallback((routeId: string, vehicleType: number) => {
    const allSelectedRoutes = [...filteredRoutes];
    if (selectedRoute) allSelectedRoutes.push(selectedRoute.route_id.toString());
    
    // If only one route selected, use default colors
    if (allSelectedRoutes.length < 2) {
      return vehicleType === 0 ? '#8B5CF6' : '#3B82F6';
    }
    
    // Multiple routes - assign unique colors
    const routeIndex = allSelectedRoutes.indexOf(routeId);
    if (routeIndex === -1) {
      // Fallback to default if route not in selection
      return vehicleType === 0 ? '#8B5CF6' : '#3B82F6';
    }
    
    return routeColorPalette[routeIndex % routeColorPalette.length];
  }, [filteredRoutes, selectedRoute]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    centerOnUser: () => {
      if (map.current) {
        // Use real user location if available, otherwise fall back to center prop
        const targetLocation = userLocation || center;
        map.current.setView([targetLocation.lat, targetLocation.lng], 15, {
          animate: true,
          duration: 0.5,
        });
      }
    },
    drawJourneyRoute: (routeData: any) => {
      drawJourneyRoute(routeData);
    },
    clearJourneyRoute: () => {
      // Șterge rutele existente
      journeyRouteLayers.current.forEach(layer => {
        if (map.current) {
          map.current.removeLayer(layer);
        }
      });
      journeyRouteLayers.current = [];
    },
  }));

  // MEMORY OPTIMIZATION: Load shapes on-demand when route is selected
  const routeShapesQuery = useQuery(
    api.transit.getRouteShapes,
    selectedRoute && !selectedRoute.shapes ? { routeIds: [selectedRoute.route_id] } : 'skip'
  );

  // Update selectedRoute with shapes when they're loaded
  useEffect(() => {
    if (routeShapesQuery && selectedRoute && !selectedRoute.shapes) {
      const shapes = routeShapesQuery[selectedRoute.route_id];
      if (shapes) {
        console.log('📦 Loaded shapes for route:', selectedRoute.route_id, shapes.length);
        setSelectedRoute({ ...selectedRoute, shapes });
        routeShapesCache[selectedRoute.route_id] = shapes;
      }
    }
  }, [routeShapesQuery, selectedRoute]);

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

      // Fit map to route bounds only once - user can pan/zoom after
      map.current.fitBounds(selectedRouteLayer.current.getBounds(), {
        padding: [50, 50],
        maxZoom: 15, // Don't zoom in too much
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

  // Draw filtered routes on map
  // MEMORY OPTIMIZATION: Load shapes only for filtered routes
  const filteredRouteShapesQuery = useQuery(
    api.transit.getRouteShapes,
    filteredRoutes.length > 0 && !selectedRoute ? { routeIds: filteredRoutes } : 'skip'
  );

  useEffect(() => {
    if (!map.current || !transitData?.routes) return;

    // Clear existing filtered route layers
    filteredRouteLayers.current.forEach(layer => {
      if (map.current) {
        map.current.removeLayer(layer);
      }
    });
    filteredRouteLayers.current = [];

    // If no filters or selectedRoute exists, don't draw anything
    if (filteredRoutes.length === 0 || selectedRoute) {
      return;
    }

    console.log('🗺️ Drawing filtered routes:', filteredRoutes);

    // Wait for shapes to load
    if (!filteredRouteShapesQuery) {
      console.log('🗺️ Waiting for filtered route shapes to load...');
      return;
    }

    // Draw each filtered route
    filteredRoutes.forEach((routeId, index) => {
      const route = transitData.routes.find((r: any) => r.route_id === routeId);
      
      if (!route) return;

      // Get shapes from cache or query result
      const shapes = routeShapesCache[routeId] || filteredRouteShapesQuery[routeId];
      
      if (shapes && shapes.length > 0 && map.current) {
        // Cache shapes for future use
        if (!routeShapesCache[routeId]) {
          routeShapesCache[routeId] = shapes;
        }

        // Use color from palette for multiple routes
        const color = routeColorPalette[index % routeColorPalette.length];
        
        const polyline = L.polyline(
          shapes.map((point: any) => [point.lat, point.lon]),
          {
            color: color,
            weight: 5,
            opacity: 0.8,
          }
        ).addTo(map.current);

        filteredRouteLayers.current.push(polyline);
        console.log(`🗺️ Drew route ${route.route_short_name} with color ${color}`);
      }
    });

    // Fit map to show all filtered routes only once when filter changes
    // Don't lock the map - user can still pan/zoom after initial fit
    if (filteredRouteLayers.current.length > 0 && map.current) {
      const group = L.featureGroup(filteredRouteLayers.current);
      map.current.fitBounds(group.getBounds(), { 
        padding: [50, 50],
        maxZoom: 15, // Don't zoom in too much
      });
    }

    return () => {
      filteredRouteLayers.current.forEach(layer => {
        if (map.current) {
          map.current.removeLayer(layer);
        }
      });
      filteredRouteLayers.current = [];
    };
  }, [filteredRoutes, transitData, selectedRoute, routeColorPalette, filteredRouteShapesQuery]);

  // Note: Vehicle route drawing removed - routes shown only from filters or stop selection

  // Clean up vehicle route when dialog closes
  useEffect(() => {
    if (!isVehicleDialogOpen && vehicleRouteLayer.current && map.current) {
      map.current.removeLayer(vehicleRouteLayer.current);
      vehicleRouteLayer.current = null;
      console.log('🧹 Cleaned up vehicle route on dialog close');
    }
  }, [isVehicleDialogOpen]);

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

    // Initialize marker cluster groups
    vehicleClusterGroup.current = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 18, // No clustering at max zoom
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();

        // Don't cluster if less than 3 vehicles - show individual markers
        if (count < 3) {
          return cluster.getAllChildMarkers()[0].options.icon as L.DivIcon;
        }
        
        let size = 'small';
        if (count > 20) size = 'large';
        else if (count > 10) size = 'medium';
        
        return L.divIcon({
          html: `<div class="vehicle-cluster-marker vehicle-cluster-${size}">
            <div class="cluster-inner">
              <span>${count}</span>
            </div>
          </div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40),
        });
      },
    });
    
    map.current.addLayer(vehicleClusterGroup.current);

    // Cleanup
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (vehicleClusterGroup.current) {
        vehicleClusterGroup.current.clearLayers();
      }
      vehicleMarkersRef.current.clear();
      stopMarkersRef.current.clear();
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
      }
      map.current?.remove();
      map.current = null;
    };
  }, [center.lat, center.lng, zoom, theme]);

  // Poll transit data every 30 seconds (like Supabase implementation)
  // BUT use viewport-based filtering to avoid loading all 801 stops
  const [viewportBounds, setViewportBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);

  // Use query with viewport filtering instead of action
  // Pass undefined as args when viewportBounds is null to skip the query
  const transitDataFromViewport = useQuery(
    api.transit.getTransitDataInViewport,
    viewportBounds ?? undefined
  );

  // Update transitData when viewport data changes
  useEffect(() => {
    if (transitDataFromViewport) {
      setTransitData(transitDataFromViewport);
      console.log('🔄 Transit data updated from viewport:', {
        vehicles: transitDataFromViewport.vehicles?.length || 0,
        stops: transitDataFromViewport.stops?.length || 0,
        routes: transitDataFromViewport.routes?.length || 0,
      });
    }
  }, [transitDataFromViewport]);

  // Update viewport bounds when map moves or zooms
  useEffect(() => {
    if (!map.current) return;

    const updateViewportBounds = () => {
      if (!map.current) return;
      
      const bounds = map.current.getBounds();
      const newBounds = {
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      };
      
      setViewportBounds(newBounds);
      console.log('🗺️ Viewport bounds updated:', newBounds);
    };

    // Initial bounds
    updateViewportBounds();

    // Update on move/zoom (debounced to avoid excessive queries)
    let debounceTimer: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateViewportBounds, 500); // 500ms debounce
    };

    map.current.on('moveend', debouncedUpdate);
    map.current.on('zoomend', debouncedUpdate);

    return () => {
      if (map.current) {
        map.current.off('moveend', debouncedUpdate);
        map.current.off('zoomend', debouncedUpdate);
      }
      clearTimeout(debounceTimer);
    };
  }, []);

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

  // Track user location with geolocation
  useEffect(() => {
    if (!map.current) return;

    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.log('❌ Geolocation not supported');
      return;
    }

    // Request user location
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { lat: latitude, lng: longitude };
        
        setUserLocation(newLocation);

        // Create or update user location marker
        if (!userLocationMarker.current && map.current) {
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

          userLocationMarker.current = L.marker([latitude, longitude], { 
            icon: userIcon,
            zIndexOffset: 1000, // Keep user marker on top
          }).addTo(map.current);

          console.log('📍 User location marker created:', newLocation);
        } else if (userLocationMarker.current) {
          // Update existing marker position
          userLocationMarker.current.setLatLng([latitude, longitude]);
          console.log('📍 User location updated:', newLocation);
        }
      },
      (error) => {
        console.log('❌ Geolocation error:', error.message);
        // Don't show marker if location cannot be obtained
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    // Cleanup function
    return () => {
      navigator.geolocation.clearWatch(watchId);
      if (userLocationMarker.current && map.current) {
        map.current.removeLayer(userLocationMarker.current);
        userLocationMarker.current = null;
      }
    };
  }, []);

  // Check if a point is within current viewport
  const isInViewport = useCallback((lat: number, lng: number): boolean => {
    if (!map.current) return true;
    const bounds = map.current.getBounds();
    return bounds.contains([lat, lng]);
  }, []);

  // Calculate the next stop for a vehicle based on its position and route direction
  const calculateNextStop = useCallback((vehicle: any, transitData: any): string | null => {
    if (!vehicle || !transitData) return null;

    try {
      // Get the trip ID for this route
      const tripId = transitData.routeToTripMap?.[vehicle.routeId];
      if (!tripId) {
        console.log('⚠️ No trip found for route:', vehicle.routeId);
        return null;
      }

      // Get the stop sequence for this trip
      const stopSequence = transitData.tripStopSequences?.[tripId];
      if (!stopSequence || stopSequence.length === 0) {
        console.log('⚠️ No stop sequence found for trip:', tripId);
        return null;
      }

      // Get all stops with their details and distances from vehicle
      const vehicleLat = vehicle.latitude;
      const vehicleLon = vehicle.longitude;

      const stopsWithDistance = stopSequence.map((stopSeq: any) => {
        const stop = transitData.stops?.find((s: any) => s.id === stopSeq.stopId);
        if (!stop) return null;

        const distance = calculateDistance(vehicleLat, vehicleLon, stop.latitude, stop.longitude);
        
        return {
          ...stopSeq,
          stop,
          distance,
        };
      }).filter(Boolean);

      // Sort by sequence (order of stops on the route)
      stopsWithDistance.sort((a: any, b: any) => a.sequence - b.sequence);

      if (stopsWithDistance.length === 0) {
        console.log('⚠️ No stops found in sequence');
        return null;
      }

      // Find the closest stop to the vehicle's current position
      let closestStopIndex = 0;
      let minDistance = Infinity;
      
      stopsWithDistance.forEach((stopData: any, index: number) => {
        if (stopData.distance < minDistance) {
          minDistance = stopData.distance;
          closestStopIndex = index;
        }
      });

      // If the closest stop is very close (< 100m), assume vehicle is at or has passed it
      // Return the next stop in sequence
      if (minDistance < 0.1) { // Less than 100 meters
        const nextStopIndex = closestStopIndex + 1;
        if (nextStopIndex < stopsWithDistance.length) {
          const nextStop = stopsWithDistance[nextStopIndex];
          console.log('✅ Vehicle at stop, next stop:', nextStop.stop.name);
          return nextStop.stop.name;
        } else {
          // Vehicle at last stop, return first stop (circular route)
          const firstStop = stopsWithDistance[0];
          console.log('🔄 Vehicle at last stop, returning to:', firstStop.stop.name);
          return firstStop.stop.name;
        }
      }

      // Vehicle is between stops - find which stops it's between
      // Look at stops ahead in the sequence from the closest stop
      let candidateStops = [];
      
      // Check next 3 stops from closest
      for (let i = closestStopIndex; i < Math.min(closestStopIndex + 3, stopsWithDistance.length); i++) {
        candidateStops.push(stopsWithDistance[i]);
      }

      // If we're near the end, also consider wrapping to beginning
      if (closestStopIndex >= stopsWithDistance.length - 2) {
        candidateStops.push(stopsWithDistance[0]);
        if (stopsWithDistance.length > 1) {
          candidateStops.push(stopsWithDistance[1]);
        }
      }

      // From candidates, find the closest one that's not too far behind
      const validCandidates = candidateStops.filter((stopData: any) => {
        // Accept stops within 2km
        return stopData.distance < 2.0;
      });

      if (validCandidates.length === 0) {
        // No valid candidates, return closest stop
        const closestStop = stopsWithDistance[closestStopIndex];
        console.log('⚠️ No valid candidates, showing closest:', closestStop.stop.name);
        return closestStop.stop.name;
      }

      // Get the closest valid candidate
      const nextStop = validCandidates.reduce((closest: any, current: any) => {
        if (!closest) return current;
        return current.distance < closest.distance ? current : closest;
      }, null);

      if (nextStop && nextStop.stop) {
        console.log('🎯 Next stop:', nextStop.stop.name, `(${(nextStop.distance * 1000).toFixed(0)}m away, sequence: ${nextStop.sequence})`);
        return nextStop.stop.name;
      }

      return null;
    } catch (error) {
      console.error('❌ Error calculating next stop:', error);
      return null;
    }
  }, []);

  // Funcție pentru desenarea rutei complete cu segmente diferite
  const drawJourneyRoute = useCallback((routeData: any) => {
    if (!map.current) return;

    // Șterge rutele existente
    journeyRouteLayers.current.forEach(layer => {
      if (map.current) {
        map.current.removeLayer(layer);
      }
    });
    journeyRouteLayers.current = [];

    if (!routeData || !routeData.legs) return;

    console.log('🗺️ Drawing journey route with', routeData.legs.length, 'legs');

    // Track transfer points (where mode changes)
    const transferPoints: Array<{ 
      lat: number; 
      lng: number; 
      from: string; 
      to: string;
      fromStation?: string;
      toStation?: string;
      type: 'transfer' | 'departure';
      cameFromWalk?: boolean;
    }> = [];

    // Desenează fiecare segment (leg) al călătoriei
    routeData.legs.forEach((leg: any, index: number) => {
      if (!leg.coordinates || leg.coordinates.length < 2) {
        console.log(`⚠️ Skipping leg ${index} - insufficient coordinates:`, leg.coordinates?.length || 0);
        return;
      }

      const coordinates = leg.coordinates.map((coord: any) => [coord.lat, coord.lng]);
      
      console.log(`📍 Drawing leg ${index}:`, {
        mode: leg.mode,
        points: coordinates.length,
        from: leg.from || 'N/A',
        to: leg.to || 'N/A'
      });
      
      // Determină stilul bazat pe tipul de transport
      let lineStyle: L.PolylineOptions;
      
      if (leg.mode === 'WALK') {
        // Mers pe jos = linie discontinuă
        lineStyle = {
          color: '#FF6B6B',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 10', // Linie discontinuă
          lineCap: 'round',
        };
      } else if (leg.mode === 'TRANSIT') {
        // Transport public = linie continuă colorată
        const transitColor = leg.routeColor || '#3B82F6';
        lineStyle = {
          color: transitColor,
          weight: 6,
          opacity: 0.9,
          lineCap: 'round',
        };
        
        // Salvează punctul de transfer (stația unde urci în noul vehicul)
        if (index > 0 && leg.from) {
          const previousLeg = routeData.legs[index - 1];
          transferPoints.push({
            lat: coordinates[0][0],
            lng: coordinates[0][1],
            // De unde cobori (doar dacă nu e mers pe jos)
            from: previousLeg.mode === 'WALK' ? '' : `${previousLeg.routeShortName} (${previousLeg.to})`,
            // Unde urci (vehicul nou)
            to: `${leg.routeShortName} (${leg.from})`,
            // Salvăm și numele stațiilor pentru popup mai clar
            fromStation: previousLeg.to || '',
            toStation: leg.from || '',
            type: 'transfer', // Transfer (cu sau fără coborâre)
            cameFromWalk: previousLeg.mode === 'WALK' // Flag pentru a ști dacă vii pe jos
          });
        }
        
        // Adaugă marker când cobori din vehicul (indiferent dacă mergi pe jos sau te oprești)
        if (leg.to) {
          const lastCoord = coordinates[coordinates.length - 1];
          const nextLeg = routeData.legs[index + 1];
          
          // Doar dacă următorul leg există și nu e tot TRANSIT (deci fie WALK fie sfârșitul)
          if (!nextLeg || nextLeg.mode !== 'TRANSIT') {
            transferPoints.push({
              lat: lastCoord[0],
              lng: lastCoord[1],
              from: `${leg.routeShortName} (${leg.to})`,
              to: nextLeg?.mode === 'WALK' ? 'Mers pe jos' : '', // Dacă mergi pe jos sau te oprești
              fromStation: leg.to || '',
              toStation: '',
              type: 'departure', // Coborâre din vehicul
              cameFromWalk: false
            });
          }
        }
      } else {
        // Alte moduri (cycling, etc)
        lineStyle = {
          color: '#10B981',
          weight: 4,
          opacity: 0.8,
          dashArray: '5, 5',
          lineCap: 'round',
        };
      }

      // Creează polyline
      const polyline = L.polyline(coordinates, lineStyle);
      
      // Adaugă popup cu informații despre segment
      let popupContent = '';
      if (leg.mode === 'WALK') {
        popupContent = `🚶 Mers pe jos<br/>📏 ${leg.distance || 'N/A'}<br/>⏱️ ${leg.duration || 'N/A'}`;
      } else if (leg.mode === 'TRANSIT') {
        popupContent = `🚌 ${leg.routeShortName || 'Transport'}<br/>📍 ${leg.from} → ${leg.to}<br/>⏱️ ${leg.duration || 'N/A'}`;
      }
      
      if (popupContent) {
        polyline.bindPopup(popupContent);
      }

      // Adaugă pe hartă
      polyline.addTo(map.current!);
      journeyRouteLayers.current.push(polyline);
    });

    // Adaugă markere pentru punctele de transfer și coborâre
    transferPoints.forEach((point, idx) => {
      const isDeparture = point.type === 'departure';
      const cameFromWalk = point.cameFromWalk;
      
      // Toate markerele sunt portocalii cu ↔
      const transferMarker = L.marker([point.lat, point.lng], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background: #F59E0B; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                  <span style="color: white; font-size: 14px; font-weight: bold;">↔</span>
                </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map.current!);
      
      // Popup-uri diferite în funcție de situație
      let popupContent = '';
      
      if (isDeparture) {
        // Cobori din vehicul și fie mergi pe jos, fie te oprești
        popupContent = `🚏 <strong>Coborâre</strong><br/>` +
          `📍 Stație: ${point.fromStation}<br/>` +
          `🚌 Coborî din: ${point.from}`;
        
        if (point.to) {
          popupContent += `<br/>🚶 Apoi: ${point.to}`;
        }
      } else if (cameFromWalk) {
        // Urci în vehicul după mers pe jos - NU arăta "Coborî din"
        popupContent = `🚏 <strong>Urcare</strong><br/>` +
          `📍 Stație: ${point.toStation || point.fromStation}<br/>` +
          `🚌 Urci în: ${point.to}`;
      } else {
        // Transfer clasic: cobori dintr-un vehicul și urci în altul
        popupContent = `🔄 <strong>Transfer</strong><br/>` +
          `📍 Stație: ${point.fromStation || point.toStation}<br/>` +
          `🚌 Coborî din: ${point.from}<br/>` +
          `🚌 Urci în: ${point.to}`;
      }
      
      transferMarker.bindPopup(popupContent);
      journeyRouteLayers.current.push(transferMarker);
    });

    // Adaugă markere pentru start și destinație
    if (routeData.start) {
      const startMarker = L.marker([routeData.start.lat, routeData.start.lng], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background: #10B981; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                  <span style="color: white; font-size: 18px;">📍</span>
                </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      }).addTo(map.current);
      
      startMarker.bindPopup('🟢 Pornire');
      journeyRouteLayers.current.push(startMarker);
    }

    if (routeData.end) {
      const endMarker = L.marker([routeData.end.lat, routeData.end.lng], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background: #EF4444; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                  <span style="color: white; font-size: 18px;">🎯</span>
                </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      }).addTo(map.current);
      
      endMarker.bindPopup('🔴 Destinație');
      journeyRouteLayers.current.push(endMarker);
    }

    // Ajustează harta pentru a arăta întreaga rută
    if (journeyRouteLayers.current.length > 0) {
      const group = L.featureGroup(journeyRouteLayers.current);
      map.current.fitBounds(group.getBounds(), {
        padding: [50, 50],
        maxZoom: 15,
      });
    }

    console.log('✅ Journey route drawn successfully');
  }, []);

  // Optimized marker update with viewport filtering
  const updateMarkers = useCallback((immediate: boolean = false) => {
    if (!map.current || !transitData) return;

    // Throttle updates only for map movements, not for filter changes
    if (!immediate && updateTimeoutRef.current) return;
    if (!immediate) {
      updateTimeoutRef.current = setTimeout(() => {
        updateTimeoutRef.current = null;
      }, 300); // Increased throttle time to 300ms
    }

    const doUpdate = () => {
      try {
        // Safety check: ensure transitData exists and has expected structure
        if (!transitData || typeof transitData !== 'object') {
          console.log('⚠️ Transit data not ready or invalid');
          return;
        }

        const currentVehicleIds = new Set<string>();
        const currentStopIds = new Set<string>();

        // Get current zoom level
        const currentZoom = map.current?.getZoom() || 13;

        // Filter vehicles: by route if selected and by vehicle type
        // No viewport filtering needed - already done server-side!
        const activeRouteFilter = selectedRoute ? selectedRoute.route_id : null;
        const hasManualFilters = filteredRoutes.length > 0;
        
        console.log('🔍 Filtering with selectedVehicleTypes:', selectedVehicleTypes);
        
        let filteredVehicles = transitData.vehicles?.filter((v: any) => {
          try {
            // Validate coordinates
            if (!v.latitude || !v.longitude || 
                typeof v.latitude !== 'number' || 
                typeof v.longitude !== 'number' ||
                isNaN(v.latitude) || isNaN(v.longitude)) {
              return false;
            }

            // Check if vehicle has valid route
            // MEMORY OPTIMIZATION: Don't require shapes for vehicle display
            const vehicleRoute = transitData.routes?.find((r: any) => r.route_id === v.routeId);
            if (!vehicleRoute) {
              return false;
            }

            // Filter by vehicle type (0=tram, 1=bus)
            const vehicleType = v.vehicle_type === 0 ? 'tram' : 'bus';
            if (!selectedVehicleTypes.includes(vehicleType)) {
              return false;
            }
            
            // If a route is selected, show only that route
            if (activeRouteFilter) {
              return v.routeId === activeRouteFilter;
            }
            // If manual filters active, show only filtered routes
            if (hasManualFilters) {
              return filteredRoutes.includes(v.routeId?.toString());
            }
            // Otherwise show all
            return true;
          } catch (error) {
            console.error('Error filtering vehicle:', v.id, error);
            return false;
          }
        }) || [];

        // Limit number of vehicles at low zoom levels
        const maxVehicles = currentZoom < 14 ? 50 : currentZoom < 16 ? 100 : 200;
        if (filteredVehicles.length > maxVehicles) {
          // Sort by distance from center and take closest ones
          const center = map.current?.getCenter();
          if (center) {
            filteredVehicles = filteredVehicles
              .map((v: any) => ({
                ...v,
                distanceFromCenter: calculateDistance(center.lat, center.lng, v.latitude, v.longitude)
              }))
              .sort((a: any, b: any) => a.distanceFromCenter - b.distanceFromCenter)
              .slice(0, maxVehicles);
          }
        }
        
        console.log(`🚍 Displaying ${filteredVehicles.length} vehicles from viewport query (zoom: ${currentZoom})`);


        // Process vehicles with additional safety checks
        filteredVehicles?.forEach((vehicle: any) => {
          try {
            // Double-check coordinates (should already be validated but be safe)
            if (!vehicle.latitude || !vehicle.longitude || 
                typeof vehicle.latitude !== 'number' || 
                typeof vehicle.longitude !== 'number' ||
                isNaN(vehicle.latitude) || isNaN(vehicle.longitude)) {
              return;
            }

            const vehicleId = vehicle.id || `${vehicle.routeId}-${vehicle.latitude}-${vehicle.longitude}`;
            
            // Get route info - must exist due to filtering above
            const routeInfo = transitData.routes?.find((r: any) => r.route_id === vehicle.routeId);
            if (!routeInfo) return; // Extra safety check
            
            // Use route_short_name for display (e.g., "1", "28", "E26"), not vehicle label/ID
            const routeNumber = routeInfo?.route_short_name || '?';
            
            // Skip vehicles without valid route number
            if (!routeNumber || routeNumber === '?' || routeNumber === 'N/A') {
              return;
            }
            
            currentVehicleIds.add(vehicleId);

            const existingMarker = vehicleMarkersRef.current.get(vehicleId);

            if (existingMarker) {
              // Update existing marker position smoothly
              existingMarker.setLatLng([vehicle.latitude, vehicle.longitude]);
            } else {
              // Create new marker
              const vehicleColor = getRouteColor(vehicle.routeId?.toString(), vehicle.vehicle_type);
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
              });

              marker.on('click', () => {
                try {
                  // Calculate the next stop based on vehicle position and route direction
                  const nextStopName = calculateNextStop(vehicle, transitData);
                  
                  setSelectedVehicle({
                    ...vehicle,
                    routeNumber,
                    routeInfo,
                    next_stop_name: nextStopName || 'Necunoscut',
                  });
                  setIsVehicleDialogOpen(true);
                } catch (error) {
                  console.error('Error handling vehicle click:', error);
                }
              });

              vehicleMarkersRef.current.set(vehicleId, marker);
              
              if (vehicleClusterGroup.current) {
                vehicleClusterGroup.current.addLayer(marker);
              }
            }
          } catch (error) {
            console.error('Error processing vehicle:', vehicle.id, error);
          }
        });

        // Remove markers that are no longer in data or out of range
        vehicleMarkersRef.current.forEach((marker, id) => {
          if (!currentVehicleIds.has(id)) {
            if (vehicleClusterGroup.current) {
            vehicleClusterGroup.current.removeLayer(marker);
          }
          vehicleMarkersRef.current.delete(id);
        }
      });

      // Filter stops - already in viewport from server-side query
      // Just apply route filtering if needed
      let nearbyStops = transitData.stops?.filter((stop: any) => {
        if (!stop.latitude || !stop.longitude || 
            typeof stop.latitude !== 'number' || 
            typeof stop.longitude !== 'number') {
          return false;
        }
        return true;
      }) || [];

      console.log(`🚏 Total stops in viewport: ${nearbyStops.length}`);

      // If a route is selected from stop drawer or manual filters, only show stops for those routes
      const activeFilters = selectedRoute 
        ? [selectedRoute.route_id] 
        : (filteredRoutes.length > 0 ? filteredRoutes : null);
        
      if (activeFilters && transitData.tripStopSequences) {
        const routeStopIds = new Set<string>();
        
        // Find all trips for filtered routes and collect their stop IDs
        Object.entries(transitData.tripStopSequences).forEach(([tripId, sequence]: [string, any]) => {
          // Find which route this trip belongs to using routeToTripMap
          const routeId = Object.keys(transitData.routeToTripMap || {}).find(
            rId => transitData.routeToTripMap[rId] === tripId
          );
          
          if (routeId && activeFilters.includes(routeId)) {
            sequence.forEach((stopSeq: any) => {
              routeStopIds.add(String(stopSeq.stopId));
            });
          }
        });
        
        console.log(`🔍 Filtered to stops on routes ${activeFilters.join(', ')}: ${routeStopIds.size} stops`);
        
        // Filter to only stops that are part of filtered routes
        nearbyStops = nearbyStops.filter((stop: any) => routeStopIds.has(String(stop.id)));
      }
      
      // Limit stops based on zoom level and whether we have active filters
      const mapZoom = map.current?.getZoom() || 13;
      let maxStops = 0; // Default: don't show stops
      
      // Only show stops when zoomed in enough OR when filters are active
      if (activeFilters) {
        // If filters are active, show all filtered stops (already filtered by route)
        maxStops = 100; // Reduced from 200
      } else if (mapZoom >= 16) {
        // Very high zoom - show many stops
        maxStops = 50; // Reduced from 100
      } else if (mapZoom >= 15) {
        // High zoom - moderate stops
        maxStops = 30; // Reduced from 50
      } else if (mapZoom >= 14) {
        // Medium zoom - fewer stops
        maxStops = 15; // Reduced from 20
      } else if (mapZoom >= 13) {
        // Low zoom - very few stops
        maxStops = 5; // Reduced from 20
      } else {
        // Very low zoom (< 13) - no stops to avoid clutter
        maxStops = 0;
      }
      
      nearbyStops = nearbyStops.slice(0, maxStops);
      console.log(`🚏 Rendering ${nearbyStops.length} stops (max: ${maxStops}, zoom: ${mapZoom})`);

      // Only render stops if we have any after filtering
      if (nearbyStops.length > 0) {
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
          });

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
          
          // Add directly to map
          if (map.current) {
            map.current.addLayer(marker);
          }
        }
      });
      }

      // Remove stop markers that are out of range
      stopMarkersRef.current.forEach((marker, id) => {
        if (!currentStopIds.has(id)) {
          if (map.current) {
            map.current.removeLayer(marker);
          }
          stopMarkersRef.current.delete(id);
        }
      });
      } catch (error) {
        console.error('❌ Error updating markers:', error);
        
        // Clear all markers on error to prevent stuck state
        vehicleMarkersRef.current.forEach((marker) => {
          if (vehicleClusterGroup.current) {
            vehicleClusterGroup.current.removeLayer(marker);
          }
        });
        vehicleMarkersRef.current.clear();
      }
    };
    
    if (immediate) {
      doUpdate();
    } else {
      requestAnimationFrame(doUpdate);
    }
  }, [transitData, selectedRoute, isInViewport, filteredRoutes, getRouteColor, selectedVehicleTypes, calculateNextStop]);

  // Update markers when transit data changes
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Filters change already triggers viewport requery automatically via Convex reactivity
  // No need for manual fetch - viewport bounds query will auto-update

  // OLD ROUTE CALCULATION - DEPRECATED
  // Route calculation is now handled in MapView.tsx using calculateTransitRoute action
  // This effect only handles cleanup
  useEffect(() => {
    if (!map.current || !destination) {
      // Remove existing route if no destination
      if (routeLayer.current) {
        map.current?.removeLayer(routeLayer.current);
        routeLayer.current = null;
      }
      return;
    }

    // Route drawing is now handled by drawJourneyRoute() called from MapView
    console.log('⚠️ Deprecated route calculation effect - use drawJourneyRoute() instead');
  }, [destination, center]);

  return (
    <>
      <style>{`
        .custom-user-marker,
        .custom-vehicle-marker,
        .custom-stop-marker,
        .custom-dest-marker,
        .custom-cluster-icon {
          background: transparent;
          border: none;
        }
        .leaflet-container {
          background: transparent;
        }
        
        /* Vehicle Cluster Styles */
        .vehicle-cluster-marker {
          background: linear-gradient(135deg, #10b981dd, #10b981ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }
        .vehicle-cluster-marker:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6);
        }
        .vehicle-cluster-small {
          width: 40px;
          height: 40px;
        }
        .vehicle-cluster-medium {
          width: 50px;
          height: 50px;
        }
        .vehicle-cluster-large {
          width: 60px;
          height: 60px;
        }
        .cluster-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .vehicle-cluster-marker span {
          color: white;
          font-weight: bold;
          font-size: 14px;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .vehicle-cluster-medium span {
          font-size: 16px;
        }
        .vehicle-cluster-large span {
          font-size: 18px;
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
            {/* Active Route from Stop Selection - Always show when present */}
            {selectedRoute && (
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Rută din Stație</p>
                <div className="glass-strong rounded-2xl p-4 border-l-[5px] shadow-lg mb-4" style={{ 
                  borderColor: getRouteColor(selectedRoute.route_id?.toString(), selectedRoute.route_type),
                  background: `linear-gradient(135deg, ${getRouteColor(selectedRoute.route_id?.toString(), selectedRoute.route_type)}15, transparent)`
                }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${getRouteColor(selectedRoute.route_id?.toString(), selectedRoute.route_type)}dd, ${getRouteColor(selectedRoute.route_id?.toString(), selectedRoute.route_type)}ff)` }}
                      >
                        <span className="text-white font-bold text-lg">{selectedRoute.route_short_name}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{selectedRoute.route_short_name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{selectedRoute.route_long_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRoute(null);
                        if (selectedRouteLayer.current && map.current) {
                          map.current.removeLayer(selectedRouteLayer.current);
                          selectedRouteLayer.current = null;
                        }
                        if (updateTimeoutRef.current) {
                          clearTimeout(updateTimeoutRef.current);
                          updateTimeoutRef.current = null;
                        }
                        updateMarkers(true);
                      }}
                      className="text-destructive hover:scale-110 transition-transform"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
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
                      if (updateTimeoutRef.current) {
                        clearTimeout(updateTimeoutRef.current);
                        updateTimeoutRef.current = null;
                      }
                      updateMarkers(true);
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
                    // Tramvaie (route_type === 0) = MOV, Autobuze (route_type === 3) = ALBASTRU
                    const routeColor = isSelected 
                      ? getRouteColor(route.route_id?.toString(), route.route_type)
                      : (route.route_type === 0 ? '#8B5CF6' : '#3B82F6');
                    
                    return (
                      <button
                        key={route.route_id}
                        onClick={() => {
                          setFilteredRoutes(prev => {
                            const routeIdStr = route.route_id?.toString();
                            const newFilters = prev.includes(routeIdStr)
                              ? prev.filter(id => id !== routeIdStr)
                              : [...prev, routeIdStr];
                            
                            // Trigger immediate update after state change
                            setTimeout(() => {
                              if (updateTimeoutRef.current) {
                                clearTimeout(updateTimeoutRef.current);
                                updateTimeoutRef.current = null;
                              }
                              updateMarkers(true);
                            }, 0);
                            
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
