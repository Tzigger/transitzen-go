import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from 'next-themes';

interface ActiveJourneyMapProps {
  currentLocation: { lat: number; lng: number } | null;
  journeySteps: Array<{
    type: string;
    from?: string;
    to?: string;
    completed?: boolean;
    isActive?: boolean;
  }>;
  destination: { lat: number; lng: number };
}

const ActiveJourneyMap = ({ currentLocation, journeySteps, destination }: ActiveJourneyMapProps) => {
  const { theme } = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const currentLocationMarkerRef = useRef<L.Marker | null>(null);
  const pulsingCircleRef = useRef<L.Circle | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const defaultCenter = currentLocation || destination;
      
      // Initialize map with Leaflet
      const map = L.map(mapRef.current, {
        center: [defaultCenter.lat, defaultCenter.lng],
        zoom: 15,
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

    // Center map on current location smoothly
    mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 16, {
      animate: true,
      duration: 0.5,
    });

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

export default ActiveJourneyMap;
