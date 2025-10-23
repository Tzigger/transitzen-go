import { useMemo } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Clock, Bus, Train } from 'lucide-react';

// Calculate distance between two coordinates in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

interface StopArrivalsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStop: any;
  transitData: any;
  onRouteSelect: (route: any) => void;
}

export const StopArrivalsDrawer = ({ 
  open, 
  onOpenChange, 
  selectedStop, 
  transitData,
  onRouteSelect 
}: StopArrivalsDrawerProps) => {
  
  const arrivals = useMemo(() => {
    if (!selectedStop || !transitData?.routes || !transitData?.vehicles || !transitData?.trips || !transitData?.tripStopSequences) return [];

    console.log('🚏 Calculating arrivals for stop:', selectedStop.name, 'ID:', selectedStop.id);

    // Find all trips that include this stop in their sequence
    const tripsAtStop = new Set<string>();
    Object.entries(transitData.tripStopSequences).forEach(([tripId, sequence]: [string, any]) => {
      const hasStop = sequence.some((s: any) => s.stopId === selectedStop.id);
      if (hasStop) {
        tripsAtStop.add(tripId);
      }
    });

    console.log('🚏 Found trips at stop:', tripsAtStop.size);

    // Find all routes for these trips
    const routeIds = new Set<string>();
    transitData.trips.forEach((trip: any) => {
      if (tripsAtStop.has(trip.trip_id)) {
        routeIds.add(trip.route_id);
      }
    });

    console.log('🚏 Found route IDs:', Array.from(routeIds));

    // Get the actual route objects
    const routesAtStop = transitData.routes.filter((route: any) => routeIds.has(route.route_id));

    console.log('🚏 Found routes at stop:', routesAtStop.length);

    // For each route, find vehicles and calculate arrival times
    const arrivalsData = routesAtStop.map((route: any) => {
      // Find active vehicles on this route
      const vehiclesOnRoute = transitData.vehicles.filter((v: any) => {
        if (v.routeId !== route.route_id) return false;
        
        // Check if vehicle timestamp is recent (within last 30 minutes)
        if (v.timestamp) {
          const vehicleTime = new Date(v.timestamp).getTime();
          const currentTime = Date.now();
          const thirtyMinutesInMs = 30 * 60 * 1000;
          
          if (currentTime - vehicleTime > thirtyMinutesInMs) {
            return false;
          }
        }
        
        return true;
      });

      console.log(`🚌 Found ${vehiclesOnRoute.length} active vehicles on route ${route.route_short_name}`);

      // Calculate arrival times for each vehicle
      const arrivals = vehiclesOnRoute
        .map((vehicle: any) => {
          // Calculate straight-line distance from vehicle to stop
          const distance = calculateDistance(
            vehicle.latitude,
            vehicle.longitude,
            selectedStop.latitude,
            selectedStop.longitude
          );

          // Skip vehicles that are too far (more than 10 km)
          if (distance > 10) {
            return null;
          }

          // Calculate estimated time based on vehicle's current speed
          // Use average speed of 20 km/h if vehicle speed is too low or zero
          const avgSpeed = vehicle.speed > 5 ? vehicle.speed : 20; // km/h
          const timeInMinutes = Math.round((distance / avgSpeed) * 60);

          // Show all vehicles within 60 minutes
          if (timeInMinutes > 60) {
            return null;
          }

          console.log(`✅ Vehicle ${vehicle.id} (${vehicle.routeShortName}) arriving in ${timeInMinutes} min (${distance.toFixed(2)} km away)`);

          return {
            vehicleId: vehicle.id,
            vehicleLabel: vehicle.routeShortName,
            distance: distance,
            time: Math.max(1, timeInMinutes), // Minimum 1 minute
            wheelchair: vehicle.wheelchair_accessible === 'WHEELCHAIR_ACCESSIBLE',
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.time - b.time);

      console.log(`📊 Route ${route.route_short_name}: ${arrivals.length} incoming vehicles`);

      return {
        route,
        arrivals,
        vehicleType: route.route_type === 0 ? 'tram' : 'bus',
        color: route.route_color ? `#${route.route_color}` : (route.route_type === 0 ? '#8B5CF6' : '#3B82F6'),
      };
    })
    .filter((r: any) => r.arrivals.length > 0) // Only show routes with incoming vehicles
    .sort((a: any, b: any) => {
      // Sort by nearest vehicle arrival time
      const aTime = a.arrivals[0]?.time || 999;
      const bTime = b.arrivals[0]?.time || 999;
      return aTime - bTime;
    });

    console.log('🎯 Final arrivals data:', arrivalsData.length, 'routes with arrivals');

    return arrivalsData;
  }, [selectedStop, transitData]);

  const handleRouteClick = (routeData: any) => {
    onRouteSelect(routeData.route);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-card backdrop-blur-xl border-0 max-h-[75vh] rounded-t-[2rem]">
        <DrawerHeader className="text-center border-b border-white/10 pb-6">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
          <DrawerTitle className="text-2xl font-bold">
            {selectedStop?.name}
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground mt-2">
            Sosiri în timp real
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="px-6 pt-6 pb-8 space-y-3 overflow-y-auto">
          {arrivals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nu sunt vehicule în apropiere</p>
            </div>
          ) : (
            arrivals.map((item: any) => {
              const Icon = item.vehicleType === 'tram' ? Train : Bus;
              const firstArrival = item.arrivals[0];
              const secondArrival = item.arrivals[1];

              return (
                <button
                  key={item.route.route_id}
                  onClick={() => handleRouteClick(item)}
                  className="w-full glass p-5 rounded-3xl border border-white/10 hover:border-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                  style={{ 
                    borderLeftWidth: '5px', 
                    borderLeftColor: item.color,
                    background: `linear-gradient(135deg, ${item.color}05, transparent)`
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-20 h-20 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-xl"
                      style={{ background: `linear-gradient(135deg, ${item.color}dd, ${item.color}ff)` }}
                    >
                      <span className="text-white font-bold text-3xl">
                        {item.route.route_short_name}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <p className="font-semibold text-foreground text-base">
                          Linia {item.route.route_short_name}
                        </p>
                      </div>
                      
                      {item.route.route_long_name && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                          {item.route.route_long_name}
                        </p>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-lg font-bold text-primary">
                            {firstArrival.time === 0 ? 'Acum' : `${firstArrival.time} min`}
                          </span>
                          {firstArrival.vehicleLabel && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({firstArrival.vehicleLabel})
                            </span>
                          )}
                        </div>
                        
                        {secondArrival && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              {secondArrival.time} min
                              {secondArrival.vehicleLabel && (
                                <span className="text-xs opacity-70 ml-1">
                                  ({secondArrival.vehicleLabel})
                                </span>
                              )}
                            </span>
                          </>
                        )}

                        {firstArrival.wheelchair && (
                          <Badge variant="outline" className="text-xs ml-auto bg-green-500/20 text-green-400 border-green-500/30 rounded-full px-2">
                            ♿
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
