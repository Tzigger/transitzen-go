import { useEffect, useRef, useState } from 'react';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      try {
        const defaultCenter = currentLocation || destination;
        
        const map = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 15,
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#1a1a2e' }],
            },
            {
              featureType: 'all',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#8b8b9b' }],
            },
            {
              featureType: 'all',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#1a1a2e' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#2a2a3e' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#1a1a2e' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#0f0f1e' }],
            },
          ],
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;

        // Add destination marker
        new google.maps.Marker({
          position: destination,
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeWeight: 3,
            strokeColor: '#ffffff',
          },
          title: 'Destinație',
        });

        setIsLoaded(true);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Load Google Maps script
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initMap();
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
      };
      document.head.appendChild(script);

      return () => {
        // Cleanup if needed
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, []);

  // Update current location marker
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !currentLocation || !window.google) return;

    // Remove old marker if exists
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null);
    }

    // Create pulsing effect with custom marker
    const pulsingMarker = new google.maps.Marker({
      position: currentLocation,
      map: mapInstanceRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeWeight: 4,
        strokeColor: '#ffffff',
      },
      title: 'Locația ta',
      zIndex: 1000,
    });

    currentLocationMarkerRef.current = pulsingMarker;

    // Center map on current location
    mapInstanceRef.current.panTo(currentLocation);

    // Add pulsing circle around current location
    const pulsingCircle = new google.maps.Circle({
      strokeColor: '#3b82f6',
      strokeOpacity: 0.5,
      strokeWeight: 2,
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
      map: mapInstanceRef.current,
      center: currentLocation,
      radius: 50,
    });

    // Animate pulsing effect
    let radius = 50;
    let growing = true;
    const pulseInterval = setInterval(() => {
      if (growing) {
        radius += 2;
        if (radius >= 100) growing = false;
      } else {
        radius -= 2;
        if (radius <= 50) growing = true;
      }
      pulsingCircle.setRadius(radius);
    }, 50);

    return () => {
      clearInterval(pulseInterval);
      pulsingCircle.setMap(null);
    };
  }, [currentLocation, isLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Se încarcă harta...</p>
          </div>
        </div>
      )}

      {/* Current location indicator */}
      {currentLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-card px-4 py-2 rounded-full backdrop-blur-xl shadow-xl">
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
              mapInstanceRef.current.panTo(currentLocation);
              mapInstanceRef.current.setZoom(16);
            }
          }}
          className="absolute bottom-4 right-4 w-12 h-12 glass-card rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors shadow-xl"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-primary"
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
