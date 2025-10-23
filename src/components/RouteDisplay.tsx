import { Bus, Clock, MapPin, ArrowRight, Navigation } from "lucide-react";
import { Button } from "./ui/button";
import { memo } from "react";

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
  crowdingLevel?: 'low' | 'medium' | 'high';
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
  onConfirmRoute: () => void;
  selectedRoute?: RouteOption | null;
}

const RouteDisplay = ({ routes, onSelectRoute, onConfirmRoute, selectedRoute }: RouteDisplayProps) => {
  if (!routes || routes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        📍 Plan de călătorie detaliat
      </h3>
      
      {routes.map((route, index) => (
        <div
          key={index}
          onClick={() => onSelectRoute(route)}
          className={`glass p-6 rounded-2xl cursor-pointer transition-all ${
            selectedRoute === route
              ? 'ring-2 ring-primary bg-primary/10'
              : 'hover:bg-white/5'
          }`}
        >
          {/* Route Summary */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {route.totalDuration} min
                </p>
                <p className="text-sm text-muted-foreground">
                  🚀 Plecare: <span className="font-semibold text-foreground">{route.departureTime}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  🎯 Sosire: <span className="font-semibold text-foreground">{route.arrivalTime}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Distanță totală</p>
              <p className="text-xl font-bold text-primary">{route.totalDistance}</p>
            </div>
          </div>

          {/* Detailed Steps */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Pașii călătoriei
            </h4>
            
            {route.segments.map((segment: RouteSegment, segIdx: number) => (
              <div key={segIdx} className="relative">
                {/* Connector line */}
                {segIdx < route.segments.length - 1 && (
                  <div className="absolute left-[23px] top-[60px] w-0.5 h-[calc(100%+16px)] bg-gradient-to-b from-primary/50 to-transparent" />
                )}
                
                <div className="glass-card p-4 rounded-xl hover:border-primary/30 transition-colors">
                  {segment.mode === 'TRANSIT' ? (
                    <div className="flex items-start gap-4">
                      <div className="relative z-10 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/30">
                        <Bus className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                            {segment.vehicle?.type === 'BUS' ? '🚌' : '🚋'} {segment.vehicle?.line}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {segment.vehicle?.name}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex items-start gap-2">
                            <span className="text-primary text-lg">🟢</span>
                            <div>
                              <p className="text-xs text-muted-foreground">Urcă în stația</p>
                              <p className="font-semibold text-foreground">{segment.from}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2 pl-7">
                            <div className="text-xs text-muted-foreground">
                              Călătorește {segment.stops} {segment.stops === 1 ? 'oprire' : 'opriri'}
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <span className="text-destructive text-lg">🔴</span>
                            <div>
                              <p className="text-xs text-muted-foreground">Coboară în stația</p>
                              <p className="font-semibold text-foreground">{segment.to}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs">
                          <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                            ⏱️ {segment.duration}
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-secondary/10 text-secondary font-medium">
                            📏 {segment.distance}
                          </span>
                          {segment.crowdingLevel && (
                            <span className={`px-2 py-1 rounded-lg font-medium ${
                              segment.crowdingLevel === 'high' 
                                ? 'bg-red-500/20 text-red-400' 
                                : segment.crowdingLevel === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {segment.crowdingLevel === 'high' ? '🔴 Aglomerat' : 
                               segment.crowdingLevel === 'medium' ? '🟡 Moderat' : 
                               '🟢 Liber'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="relative z-10 w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 border-2 border-secondary/30">
                        <Navigation className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary font-bold text-sm">
                            🚶 Mers pe jos
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {segIdx === 0 
                            ? "Mergi pe jos până la prima stație" 
                            : segIdx === route.segments.length - 1
                            ? "Mergi pe jos până la destinație"
                            : "Mergi pe jos până la următoarea stație"}
                        </p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="px-2 py-1 rounded-lg bg-secondary/10 text-secondary font-medium">
                            ⏱️ {segment.duration}
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-secondary/10 text-secondary font-medium">
                            📏 {segment.distance}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedRoute === route && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirmRoute();
                }}
                className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12 text-base font-semibold"
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

export default memo(RouteDisplay);
