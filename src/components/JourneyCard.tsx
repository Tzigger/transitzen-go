import { Button } from "@/components/ui/button";
import { Clock, MapPin, TrendingUp, Users, MoreVertical, Calendar, Trash2, Navigation, Bus, Route } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, memo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FavoriteRoute {
  id: string;
  user_id: string;
  name: string;
  origin: string;
  origin_lat: number;
  origin_lng: number;
  destination: string;
  destination_lat: number;
  destination_lng: number;
  route_info: {
    totalDuration?: number;
    totalDistance?: string;
    segments?: any[];
    averageCrowding?: number;
  } | null;
  created_at: string;
}

interface JourneyCardProps {
  route: FavoriteRoute;
  onPlanJourney: (route: FavoriteRoute) => void;
  onDelete: (id: string) => void;
}

const JourneyCard = ({ route, onPlanJourney, onDelete }: JourneyCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getCrowdingColor = (level: number) => {
    if (level < 50) return 'bg-success';
    if (level < 80) return 'bg-warning';
    return 'bg-destructive';
  };

  const getAverageCrowding = () => {
    if (!route.route_info?.segments) return 0;
    
    const transitSegments = route.route_info.segments.filter(
      (seg: any) => seg.mode === 'TRANSIT' && seg.crowdingLevel
    );
    
    if (transitSegments.length === 0) return 0;
    
    const levels = { low: 30, medium: 60, high: 90 };
    const avg = transitSegments.reduce((sum: number, seg: any) => {
      return sum + (levels[seg.crowdingLevel as keyof typeof levels] || 0);
    }, 0) / transitSegments.length;
    
    return Math.round(avg);
  };

  const transitSegments = route.route_info?.segments?.filter((seg: any) => seg.mode === 'TRANSIT') || [];
  const walkingSegments = route.route_info?.segments?.filter((seg: any) => seg.mode === 'WALKING') || [];
  const totalWalkTime = walkingSegments.reduce((sum: number, seg: any) => sum + seg.durationMinutes, 0);
  const crowdingLevel = getAverageCrowding();

  return (
    <>
      <div className="glass-card p-6 rounded-[2rem] space-y-4 hover-lift relative overflow-hidden group shadow-xl">
        {/* Background gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Route className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-xl text-foreground">{route.name}</h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{route.destination}</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/10">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-card border-white/10">
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  <Route className="w-4 h-4 mr-2" />
                  Vezi detalii
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(route.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Șterge
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Route Statistics */}
          {route.route_info && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="glass p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Durată</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {route.route_info.totalDuration || 0} min
                </p>
              </div>
              
              <div className="glass p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Distanță</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {route.route_info.totalDistance || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Route Info */}
          {transitSegments.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {transitSegments.map((segment: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1">
                  <div className="glass px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                    <span className="text-sm">
                      {segment.vehicle?.type === 'BUS' ? '🚍' : '🚊'}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{segment.vehicle?.line}</span>
                  </div>
                  {idx < transitSegments.length - 1 && (
                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
              ))}
              {totalWalkTime > 0 && (
                <div className="glass px-4 py-2 rounded-full text-xs text-muted-foreground border border-white/10">
                  👣 {totalWalkTime} min
                </div>
              )}
            </div>
          )}

          {/* Crowding Indicator */}
          {crowdingLevel > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Aglomerație medie estimată
                </p>
                <span className="text-sm font-medium text-foreground">{crowdingLevel}%</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getCrowdingColor(crowdingLevel)} transition-all rounded-full`}
                  style={{ width: `${crowdingLevel}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button 
            onClick={() => onPlanJourney(route)}
            className="w-full gradient-primary h-14 text-base font-semibold group rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Calendar className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            Călătorește acum
          </Button>
        </div>
      </div>

      {/* Details Dialog */}
      {route.route_info && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="glass-card max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{route.name}</DialogTitle>
              <DialogDescription>
                <span className="font-semibold text-foreground">{route.origin}</span> → <span className="font-semibold text-foreground">{route.destination}</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {/* Summary */}
              <div className="glass p-4 rounded-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Durată estimată</p>
                    <p className="text-lg font-bold text-foreground">{route.route_info.totalDuration} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Distanță totală</p>
                    <p className="text-lg font-bold text-foreground">{route.route_info.totalDistance}</p>
                  </div>
                </div>
              </div>

              {/* Route Segments */}
              {route.route_info.segments && route.route_info.segments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Pașii călătoriei</h4>
                  {route.route_info.segments.map((segment: any, idx: number) => (
                    <div key={idx} className="glass-card p-4 rounded-xl">
                      {segment.mode === 'TRANSIT' ? (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <Bus className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-primary">{segment.vehicle?.line}</span>
                              {segment.crowdingLevel && (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
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
                            <p className="text-sm text-muted-foreground mb-2">{segment.vehicle?.name}</p>
                            <div className="space-y-1 text-sm">
                              <p>🟢 {segment.from}</p>
                              <p className="text-muted-foreground pl-4">{segment.stops} {segment.stops === 1 ? 'oprire' : 'opriri'}</p>
                              <p>🔴 {segment.to}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">⏱️ {segment.duration} • 📏 {segment.distance}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                            <Navigation className="w-5 h-5 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground mb-1">🚶 Mers pe jos</p>
                            <p className="text-xs text-muted-foreground">⏱️ {segment.duration} • 📏 {segment.distance}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button 
                onClick={() => {
                  setShowDetails(false);
                  onPlanJourney(route);
                }}
                className="w-full gradient-primary h-12 text-base font-semibold rounded-full"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Planifică călătoria
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default memo(JourneyCard);
