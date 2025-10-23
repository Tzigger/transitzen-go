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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Opțiuni de rută</h3>
      {routes.map((route, index) => (
        <div
          key={index}
          className={`glass-card p-5 rounded-2xl cursor-pointer transition-all border-2 ${
            selectedRoute === route
              ? "border-primary bg-primary/10"
              : "border-transparent hover:bg-white/5"
          }`}
          onClick={() => onSelectRoute(route)}
        >
          {/* Route header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg text-foreground">
                {route.totalDuration} min
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Plecare</div>
              <div className="font-semibold text-foreground">{route.departureTime}</div>
            </div>
          </div>

          {/* Route segments */}
          <div className="space-y-3">
            {route.segments.map((segment, segIndex) => (
              <div key={segIndex} className="flex items-start gap-3">
                {segment.mode === "TRANSIT" && segment.vehicle ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Bus className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">
                          {segment.vehicle.type} {segment.vehicle.line}
                        </span>
                        {segment.stops && (
                          <span className="text-xs text-muted-foreground">
                            • {segment.stops} {segment.stops === 1 ? "stație" : "stații"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>{segment.from}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{segment.to}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {segment.duration}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Navigation className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground mb-1">
                        Mers pe jos
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {segment.distance} • {segment.duration}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {selectedRoute === route && (
            <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
              Selectează această rută
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default RouteDisplay;
