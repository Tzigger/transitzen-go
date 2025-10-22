import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Navigation, Search, Layers, Bus, Train } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import Map, { MapRef } from "@/components/Map";
import { supabase } from "@/integrations/supabase/client";

const vehicleTypes = [
  { id: 'bus', label: 'Autobuze', icon: Bus, emoji: '🚍' },
  { id: 'tram', label: 'Tramvaie', icon: Train, emoji: '🚊' },
];

// User location constant to avoid recreating on every render
const USER_LOCATION = { lat: 47.1585, lng: 27.6014 };

// Calculate distance between two coordinates in km
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

const MapView = () => {
  const navigate = useNavigate();
  const mapRef = useRef<MapRef>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>(['bus', 'tram']);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [routeInfo, setRouteInfo] = useState<{ duration: string; distance: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [transitData, setTransitData] = useState<any>(null);
  const [nearbyVehicles, setNearbyVehicles] = useState<any[]>([]);

  const toggleVehicleType = (id: string) => {
    setSelectedVehicles(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-places', {
        body: {
          query,
          location: USER_LOCATION,
        },
      });

      if (error) {
        console.error('Error from search-places:', error);
        throw error;
      }

      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place: any) => {
    setSearchQuery(place.name);
    setSelectedDestination(place.address);
    setShowResults(false);
    setSearchResults([]);
  };

  const handleRouteCalculated = (duration: string, distance: string) => {
    setRouteInfo({ duration, distance });
  };

  // Fetch transit data
  useEffect(() => {
    const fetchTransitData = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-transit-data');

        if (error) {
          console.error('Error fetching transit data:', error);
          return;
        }

        setTransitData(data);
      } catch (error) {
        console.error('Error fetching transit data:', error);
      }
    };

    fetchTransitData();
    const interval = setInterval(fetchTransitData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Process nearby vehicles from transit data
  useEffect(() => {
    if (!transitData?.vehicles) return;

    const processedVehicles = transitData.vehicles
      .filter((vehicle: any) => {
        // Validate coordinates
        if (!vehicle.latitude || !vehicle.longitude) return false;
        
        // Filter out vehicles not moving
        if (!vehicle.speed || vehicle.speed < 2) return false;

        // Calculate distance
        const distance = calculateDistance(
          USER_LOCATION.lat,
          USER_LOCATION.lng,
          vehicle.latitude,
          vehicle.longitude
        );

        // Only show vehicles within 1km
        return distance <= 1;
      })
      .map((vehicle: any) => {
        const distance = calculateDistance(
          USER_LOCATION.lat,
          USER_LOCATION.lng,
          vehicle.latitude,
          vehicle.longitude
        );

        const routeInfo = transitData.routes?.find((r: any) => r.route_id === vehicle.routeId);
        const vehicleType = vehicle.vehicle_type === 0 ? 'tram' : 'bus';
        const vehicleColor = vehicle.vehicle_type === 0 ? '#8B5CF6' : '#3B82F6';

        // Find next station
        let nextStation = null;
        let nextStationDistance = null;
        
        if (transitData.routeToTripMap && transitData.tripStopSequences && transitData.stops) {
          const tripId = transitData.routeToTripMap[vehicle.routeId];
          
          if (tripId && transitData.tripStopSequences[tripId]) {
            const stopSequence = transitData.tripStopSequences[tripId];
            
            // Calculate distances to all stops in the sequence
            const stopsWithDistance = stopSequence.map((stopInfo: any) => {
              const stop = transitData.stops.find((s: any) => s.id === stopInfo.stopId);
              if (!stop) return null;
              
              const stopDist = calculateDistance(
                vehicle.latitude,
                vehicle.longitude,
                stop.latitude,
                stop.longitude
              );
              
              return {
                ...stopInfo,
                stop,
                distanceFromVehicle: stopDist,
              };
            }).filter(Boolean);
            
            // Find the closest stop that's ahead (not behind the vehicle)
            // We'll assume the vehicle is moving towards the closest stop
            const closestStop = stopsWithDistance
              .filter((s: any) => s.distanceFromVehicle > 0.05) // More than 50m away
              .sort((a: any, b: any) => a.distanceFromVehicle - b.distanceFromVehicle)[0];
            
            if (closestStop) {
              nextStation = closestStop.stop.name;
              nextStationDistance = `${Math.round(closestStop.distanceFromVehicle * 1000)}m`;
            }
          }
        }

        return {
          id: vehicle.id,
          number: vehicle.label || routeInfo?.route_short_name || '?',
          type: vehicleType === 'tram' ? 'Tramvai' : 'Autobuz',
          vehicleType,
          distance: `${Math.round(distance * 1000)}m`,
          time: `${Math.ceil((distance / 0.5) * 60)} min`, // Assuming average speed 30km/h
          speed: vehicle.speed,
          color: vehicleColor,
          routeInfo: routeInfo,
          wheelchair: vehicle.wheelchair_accessible === 'WHEELCHAIR_ACCESSIBLE',
          emoji: vehicleType === 'tram' ? '🚊' : '🚍',
          nextStation,
          nextStationDistance,
        };
      })
      .sort((a: any, b: any) => {
        // Sort by distance
        const distA = parseFloat(a.distance);
        const distB = parseFloat(b.distance);
        return distA - distB;
      })
      .slice(0, 20); // Limit to 20 nearest vehicles

    setNearbyVehicles(processedVehicles);
  }, [transitData]);

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      {/* Header */}
      <header className="absolute top-4 left-4 right-4 z-40 max-w-md mx-auto">
        <div className="glass-card backdrop-blur-xl rounded-[2rem] shadow-2xl">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="rounded-full hover:bg-white/10 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Input 
                placeholder="Caută destinație..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="glass border-white/10 h-11 rounded-2xl placeholder:text-muted-foreground pr-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              
              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 glass-card backdrop-blur-xl rounded-2xl shadow-2xl max-h-80 overflow-y-auto z-50 bg-background/95 border border-white/20">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectPlace(result)}
                      className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-lg">📍</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{result.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.address}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* No results message */}
              {showResults && searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                <div className="absolute top-full mt-2 left-0 right-0 glass-card backdrop-blur-xl rounded-2xl shadow-2xl z-50 bg-background/95 border border-white/20 px-4 py-3">
                  <p className="text-sm text-muted-foreground text-center">Nu s-au găsit rezultate</p>
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-white/10 flex-shrink-0"
              onClick={() => {
                setSearchQuery("");
                setSelectedDestination("");
                setShowResults(false);
                setRouteInfo(null);
              }}
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Route Info */}
          {routeInfo && (
            <div className="px-4 pb-3 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Durată:</span>
                <span className="font-semibold text-primary">{routeInfo.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Distanță:</span>
                <span className="font-semibold text-primary">{routeInfo.distance}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Map Container */}
      <div className="absolute inset-0 pt-24 pb-28">
        <Map 
          ref={mapRef}
          center={USER_LOCATION} 
          zoom={13} 
          destination={selectedDestination}
          onRouteCalculated={handleRouteCalculated}
        />
      </div>

      {/* Vehicle filter scroll bar with GPS button */}
      <div className="absolute bottom-28 left-0 right-0 pointer-events-none z-50">
        <div className="relative w-full">
          <div className="overflow-visible pb-2 pointer-events-auto px-6 py-2">
            <div className="flex gap-2 justify-center max-w-2xl mx-auto">
              {vehicleTypes.map((vehicle) => {
                const Icon = vehicle.icon;
                const isSelected = selectedVehicles.includes(vehicle.id);
                return (
                  <button
                    key={vehicle.id}
                    onClick={() => toggleVehicleType(vehicle.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${
                      isSelected 
                        ? 'glass-card border-2 border-primary bg-primary/10 scale-105' 
                        : 'glass border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-lg">{vehicle.emoji}</span>
                    <span className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      {vehicle.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Swipe up indicator */}
        <div className="flex justify-center pt-2 pointer-events-auto">
          <button
            onClick={() => setDrawerOpen(true)}
            className="glass-card px-8 py-3 rounded-full shadow-2xl hover:scale-110 transition-all hover:shadow-primary/20 active:scale-95"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-1.5 rounded-full bg-primary/60 animate-pulse" />
              <p className="text-xs font-medium text-muted-foreground">Swipe up pentru listă</p>
            </div>
          </button>
        </div>
        
        {/* GPS Center button - right aligned */}
        <div className="absolute bottom-0 right-4 pointer-events-auto">
          <Button 
            size="icon"
            onClick={() => mapRef.current?.centerOnUser()}
            className="w-11 h-11 rounded-full gradient-primary shadow-2xl animate-glow hover:scale-110 transition-transform"
          >
            <Navigation className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Nearby vehicles drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="glass-card backdrop-blur-xl border-0 max-h-[75vh] rounded-t-[2rem]">
          <DrawerHeader className="text-center border-b border-white/10 pb-6">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
            <DrawerTitle className="text-2xl font-bold">Vehicule apropiate</DrawerTitle>
            <DrawerDescription className="text-muted-foreground mt-2">
              Cele mai apropiate opțiuni de transport
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-6 pb-8 space-y-4 overflow-y-auto">
            {nearbyVehicles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nu sunt vehicule în apropiere</p>
              </div>
            ) : (
              nearbyVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="glass p-5 rounded-3xl border border-white/10 hover:border-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                  style={{ 
                    borderLeftWidth: '5px', 
                    borderLeftColor: vehicle.color,
                    background: `linear-gradient(135deg, ${vehicle.color}05, transparent)`
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-xl"
                      style={{ background: `linear-gradient(135deg, ${vehicle.color}dd, ${vehicle.color}ff)` }}
                    >
                      <span className="text-white font-bold text-2xl">{vehicle.number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground text-lg">
                          {vehicle.type} {vehicle.number}
                        </p>
                        {vehicle.wheelchair && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 border-green-500/30 rounded-full">
                            ♿ Accesibil
                          </Badge>
                        )}
                      </div>
                      {vehicle.routeInfo && (
                        <p className="text-xs text-muted-foreground mb-2 truncate">
                          {vehicle.routeInfo.route_long_name}
                        </p>
                      )}
                      {vehicle.nextStation && (
                        <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-primary/10 rounded-full w-fit">
                          <span className="text-xs font-semibold text-primary">→ {vehicle.nextStation}</span>
                          {vehicle.nextStationDistance && (
                            <span className="text-xs text-muted-foreground">({vehicle.nextStationDistance})</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>📍 {vehicle.distance}</span>
                        <span>•</span>
                        <span>🕐 ~{vehicle.time}</span>
                        <span>•</span>
                        <span>⚡ {vehicle.speed} km/h</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <BottomNav />
    </div>
  );
};

export default MapView;
