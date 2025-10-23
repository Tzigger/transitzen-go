import { useEffect, useRef, useState, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from 'next-themes';
import { decodePolyline } from '@/utils/polylineDecoder';

interface RouteSegment {
  type: string;
  mode?: string;
  from?: string;
  to?: string;
  distance?: string;
  duration?: string;
  vehicle?: {
    type: string;
    line: string;
    name: string;
  };
  stops?: number;
  completed?: boolean;
  isActive?: boolean;
  polyline?: string;
  startLocation?: { lat: number; lng: number };
  endLocation?: { lat: number; lng: number };
}

interface ActiveJourneyMapProps {
  currentLocation: { lat: number; lng: number } | null;
  journeySteps: RouteSegment[];
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  routeSegments: RouteSegment[];
}

const ActiveJourneyMap = ({ 
  currentLocation, 
  journeySteps, 
  origin,
  destination,
  routeSegments 
}: ActiveJourneyMapProps) => {
  const { theme } = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const currentLocationMarkerRef = useRef<L.Marker | null>(null);
  const pulsingCircleRef = useRef<L.Circle | null>(null);
  const routeLayersRef = useRef<L.Polyline[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const defaultCenter = currentLocation || origin;
      
      console.log('🗺️ Initializing ActiveJourneyMap:', {
        origin,
        destination,
        routeSegments: routeSegments?.length || 0,
        currentLocation,
      });
      
      // Initialize map with Leaflet
      const map = L.map(mapRef.current, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Initialize tile layer based on theme - same style as /map
      const tileUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      
      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Add origin marker
      const originIcon = L.divIcon({
        className: 'custom-origin-marker',
        html: `
          <div class="relative">
            <div class="relative w-10 h-10 rounded-full glass-strong flex items-center justify-center border-3 border-primary shadow-2xl">
              <svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(map);

      // Add destination marker with custom style
      const destinationIcon = L.divIcon({
        className: 'custom-destination-marker',
        html: `
          <div class="relative">
            <div class="absolute w-12 h-12 rounded-full bg-success/30 animate-ping"></div>
            <div class="relative w-12 h-12 rounded-full glass-strong flex items-center justify-center border-4 border-success shadow-2xl">
              <svg class="w-6 h-6 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
      });

      L.marker([destination.lat, destination.lng], { icon: destinationIcon }).addTo(map);

      setIsLoaded(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Draw route on map with exact polylines
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    // Clear existing route layers
    routeLayersRef.current.forEach(layer => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });
    routeLayersRef.current = [];

    // If no route segments, draw a simple line between origin and destination
    if (!routeSegments || routeSegments.length === 0) {
      const simpleLine = L.polyline(
        [[origin.lat, origin.lng], [destination.lat, destination.lng]],
        {
          color: '#3B82F6',
          weight: 4,
          opacity: 0.6,
          dashArray: '10, 10',
          smoothFactor: 1,
        }
      ).addTo(mapInstanceRef.current);
      
      routeLayersRef.current.push(simpleLine);
      
      // Fit map to show origin and destination
      mapInstanceRef.current.fitBounds(
        [[origin.lat, origin.lng], [destination.lat, destination.lng]],
        { padding: [80, 80] }
      );
      
      return;
    }

    let stopCounter = 1;

    // Draw each segment with its polyline
    routeSegments.forEach((segment, index) => {
      if (!mapInstanceRef.current) return;
      
      let coordinates: [number, number][] = [];
      
      // Try to get coordinates from polyline or fallback to start/end locations
      if (segment.polyline) {
        coordinates = decodePolyline(segment.polyline);
      } else if (segment.startLocation && segment.endLocation) {
        coordinates = [
          [segment.startLocation.lat, segment.startLocation.lng],
          [segment.endLocation.lat, segment.endLocation.lng],
        ];
      }
      
      if (coordinates.length === 0) return;

      if (segment.type === 'TRANSIT' || segment.mode === 'TRANSIT') {
        // For transit segments, draw in vehicle color
        const color = segment.vehicle?.type === 'BUS' ? '#3B82F6' : '#8B5CF6';
        const opacity = segment.completed ? 0.4 : segment.isActive ? 0.9 : 0.7;
        const weight = segment.isActive ? 6 : 5;

        const transitLine = L.polyline(coordinates, {
          color: color,
          weight: weight,
          opacity: opacity,
          smoothFactor: 1,
          className: 'route-polyline',
        }).addTo(mapInstanceRef.current);

        routeLayersRef.current.push(transitLine);

        // Add stop markers at start and end
        if (segment.startLocation) {
          const startIcon = L.divIcon({
            className: 'custom-stop-marker',
            html: `
              <div class="relative">
                <div class="w-7 h-7 rounded-full glass-strong flex items-center justify-center border-2 shadow-lg" style="border-color: ${color}; background: ${segment.completed ? '#10b981' : segment.isActive ? color : '#6b7280'}">
                  <span class="text-white text-xs font-bold">${stopCounter}</span>
                </div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          L.marker([segment.startLocation.lat, segment.startLocation.lng], { 
            icon: startIcon,
            zIndexOffset: 100,
          }).addTo(mapInstanceRef.current);
          
          stopCounter++;
        }
        
      } else if (segment.type === 'WALKING' || segment.mode === 'WALKING') {
        // For walking segments, draw dashed line
        const opacity = segment.completed ? 0.3 : segment.isActive ? 0.8 : 0.6;
        const weight = segment.isActive ? 4 : 3;
        
        const walkingLine = L.polyline(coordinates, {
          color: '#10b981',
          weight: weight,
          opacity: opacity,
          dashArray: '10, 10',
          smoothFactor: 1,
          className: 'route-polyline-walking',
        }).addTo(mapInstanceRef.current);

        routeLayersRef.current.push(walkingLine);
      }
    });

    // Fit map to show all route segments
    if (routeLayersRef.current.length > 0) {
      const group = L.featureGroup(routeLayersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds(), {
        padding: [80, 80],
      });
    }

    return () => {
      routeLayersRef.current.forEach(layer => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });
      routeLayersRef.current = [];
    };
  }, [isLoaded, routeSegments]);

  // Update tile layer when theme changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const tileUrl = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    // Remove old tile layer
    tileLayerRef.current.remove();

    // Add new tile layer with updated theme
    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapInstanceRef.current);
  }, [theme]);

  // Update current location marker with smooth pulsing animation
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !currentLocation) return;

    // Remove old marker and circle if exists
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.remove();
    }
    if (pulsingCircleRef.current) {
      pulsingCircleRef.current.remove();
    }

    // Create custom user location marker - same style as /map
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative">
          <div class="absolute w-10 h-10 rounded-full bg-primary/30 animate-ping"></div>
          <div class="relative w-10 h-10 rounded-full glass-strong flex items-center justify-center border-4 border-primary shadow-2xl">
            <div class="w-4 h-4 rounded-full bg-primary"></div>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([currentLocation.lat, currentLocation.lng], { 
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(mapInstanceRef.current);

    currentLocationMarkerRef.current = marker;

    // Add accuracy circle
    const accuracyCircle = L.circle([currentLocation.lat, currentLocation.lng], {
      color: 'rgb(59, 130, 246)',
      fillColor: 'rgb(59, 130, 246)',
      fillOpacity: 0.15,
      weight: 2,
      opacity: 0.5,
      radius: 50,
    }).addTo(mapInstanceRef.current);

    pulsingCircleRef.current = accuracyCircle;

    // Center map on current location smoothly (but only if not already focused)
    const currentCenter = mapInstanceRef.current.getCenter();
    const distance = currentCenter.distanceTo([currentLocation.lat, currentLocation.lng]);
    
    // Only recenter if user has moved significantly (more than 100m)
    if (distance > 100) {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], mapInstanceRef.current.getZoom(), {
        animate: true,
        duration: 0.5,
      });
    }

    // Animate pulsing effect
    let radius = 50;
    let growing = true;
    const pulseInterval = setInterval(() => {
      if (!pulsingCircleRef.current) {
        clearInterval(pulseInterval);
        return;
      }
      
      if (growing) {
        radius += 2;
        if (radius >= 100) growing = false;
      } else {
        radius -= 2;
        if (radius <= 50) growing = true;
      }
      pulsingCircleRef.current.setRadius(radius);
    }, 50);

    return () => {
      clearInterval(pulseInterval);
      if (pulsingCircleRef.current) {
        pulsingCircleRef.current.remove();
      }
    };
  }, [currentLocation, isLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Se încarcă harta...</p>
          </div>
        </div>
      )}

      {/* Current location indicator */}
      {currentLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-card px-4 py-2 rounded-full backdrop-blur-xl shadow-xl z-[500] border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-xs font-medium text-foreground">Tracking activ</span>
          </div>
        </div>
      )}

      {/* Route info overlay */}
      {routeSegments.length > 0 && (
        <div className="absolute bottom-20 left-4 right-4 glass-card p-3 rounded-2xl backdrop-blur-xl shadow-xl z-[500] border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-xs font-medium text-foreground">Ruta ta</span>
            </div>
            <div className="flex items-center gap-2">
              {routeSegments.filter(s => s.type === 'TRANSIT').map((seg, idx) => (
                <div key={idx} className="px-2 py-1 glass rounded-full text-xs font-semibold text-foreground border border-white/10">
                  {seg.vehicle?.type === 'BUS' ? '🚍' : '🚊'} {seg.vehicle?.line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zoom to current location button */}
      {currentLocation && (
        <button
          onClick={() => {
            if (mapInstanceRef.current && currentLocation) {
              mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 16, {
                animate: true,
                duration: 0.5,
              });
            }
          }}
          className="absolute bottom-4 right-4 w-12 h-12 glass-card rounded-full flex items-center justify-center hover:bg-primary/20 transition-all shadow-xl z-[500] border border-white/10 group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-primary group-hover:scale-110 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(ActiveJourneyMap);
