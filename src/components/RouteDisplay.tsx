import { Bus, Clock, MapPin, ArrowRight, Navigation } from "lucide-react";
import { Button } from "./ui/button";

type RouteSegment = {
  mode: string;
  vehicle?: {
    type: string;
    line: string;
    name: string;
  };
  from: string;
  to: string;
  duration: string;
  stops?: number;
  distance: string;
};

type RouteOption = {
  totalDuration: number;
  totalDistance: string;
  segments: RouteSegment[];
  departureTime: string;
  arrivalTime: string;
};

interface RouteDisplayProps {
  routes: RouteOption[];
  onSelectRoute: (route: RouteOption) => void;
  selectedRoute?: RouteOption | null;
}

const RouteDisplay = ({ routes, onSelectRoute, selectedRoute }: RouteDisplayProps) => {
  if (!routes || routes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {routes.map((route, index) => (
        <div key={index} className="glass-card p-6 rounded-[2rem] shadow-xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Plan de călătorie detaliat</h2>
          </div>

          {/* Summary Card */}
          <div 
            onClick={() => onSelectRoute(route)}
            className={`glass p-6 rounded-2xl border-2 cursor-pointer transition-all mb-6 ${
              selectedRoute === route
                ? 'border-primary bg-primary/10'
                : 'border-white/10 hover:border-primary/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="text-4xl font-bold text-foreground mb-2">
                    {route.totalDuration} min
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-primary">🚀</span> 
                      <span className="font-medium">Plecare:</span>
                      <span className="text-foreground font-semibold">{route.departureTime}</span>
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-primary">🎯</span> 
                      <span className="font-medium">Sosire:</span>
                      <span className="text-foreground font-semibold">{route.arrivalTime}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Distanță totală</p>
                <p className="text-2xl font-bold text-primary">{route.totalDistance}</p>
              </div>
            </div>
          </div>

          {/* Steps Header */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Pașii călătoriei
            </h3>
          </div>

          {/* Route Steps */}
          <div className="space-y-4">
            {route.segments.map((segment: RouteSegment, segIdx: number) => (
              <div key={segIdx} className="relative">
                {/* Connector line between steps */}
                {segIdx < route.segments.length - 1 && (
                  <div className="absolute left-[30px] top-[76px] w-0.5 h-[calc(100%+16px)] bg-gradient-to-b from-primary/40 via-primary/20 to-transparent z-0" />
                )}
                
                {segment.mode === 'TRANSIT' && segment.vehicle ? (
                  // Transit Step
                  <div className="glass p-5 rounded-2xl border border-white/10 hover:border-primary/30 transition-all relative z-10">
                    <div className="flex items-start gap-4">
                      {/* Vehicle Badge */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border-2 border-primary/40">
                          <div className="text-center">
                            <span className="text-xl">{segment.vehicle.type === 'BUS' ? '🚌' : '🚋'}</span>
                            <p className="text-sm font-bold text-primary mt-0.5">
                              {segment.vehicle.line}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Transit Details */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-4">
                          <p className="text-xs text-muted-foreground mb-1">
                            {segment.vehicle.name}
                          </p>
                        </div>

                        {/* Boarding Station */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Urcă în stația</p>
                            <p className="text-base font-bold text-foreground leading-tight">
                              {segment.from}
                            </p>
                          </div>
                        </div>

                        {/* Trip Info */}
                        <div className="flex items-center gap-2 ml-6 mb-3">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Călătorește {segment.stops} {segment.stops === 1 ? 'oprire' : 'opriri'}
                          </span>
                        </div>

                        {/* Alighting Station */}
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Coboară în stația</p>
                            <p className="text-base font-bold text-foreground leading-tight">
                              {segment.to}
                            </p>
                          </div>
                        </div>

                        {/* Duration & Distance */}
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/10">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{segment.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Navigation className="w-3.5 h-3.5" />
                            <span>{segment.distance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Walking Step
                  <div className="glass p-5 rounded-2xl border border-white/10 hover:border-primary/30 transition-all relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center border-2 border-secondary/40 flex-shrink-0">
                        <Navigation className="w-7 h-7 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🚶</span>
                          <span className="text-base font-bold text-foreground">Mers pe jos</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {segIdx === 0 
                            ? "Mergi pe jos până la prima stație" 
                            : segIdx === route.segments.length - 1
                            ? "Mergi pe jos până la destinație"
                            : "Mergi pe jos până la următoarea stație"}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{segment.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Navigation className="w-3.5 h-3.5" />
                            <span>{segment.distance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Confirm Button */}
          {selectedRoute === route && (
            <div className="mt-6">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectRoute(route);
                }}
                className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl text-base font-semibold"
              >
                ✅ Confirmă această rută
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RouteDisplay;
