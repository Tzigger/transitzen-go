import { Button } from "@/components/ui/button";
import { Clock, MapPin, TrendingUp, Users, MoreVertical, Play, Trash2, Power, Navigation, Bus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
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

interface Journey {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  arrival_date: string;
  arrival_time: string;
  departure_time: string | null;
  estimated_duration: number;
  is_active: boolean;
  route_details: {
    segments: any[];
    totalDistance: string;
  };
}

interface JourneyCardProps {
  journey: Journey;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

const JourneyCard = ({ journey, onToggleActive, onDelete }: JourneyCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getAverageCrowding = () => {
    const transitSegments = journey.route_details.segments.filter(
      (seg: any) => seg.mode === 'TRANSIT' && seg.crowdingLevel
    );
    
    if (transitSegments.length === 0) return 0;
    
    const levels = { low: 30, medium: 60, high: 90 };
    const avg = transitSegments.reduce((sum: number, seg: any) => {
      return sum + (levels[seg.crowdingLevel as keyof typeof levels] || 0);
    }, 0) / transitSegments.length;
    
    return Math.round(avg);
  };

  const getCrowdingColor = (level: number) => {
    if (level < 50) return 'bg-success';
    if (level < 80) return 'bg-warning';
    return 'bg-destructive';
  };

  const getStatusColor = () => {
    return journey.is_active 
      ? 'bg-success/20 text-success' 
      : 'bg-muted/20 text-muted-foreground';
  };

  const calculateTimeUntilDeparture = () => {
    if (!journey.departure_time || !journey.arrival_date) return null;
    
    const now = new Date();
    const [hours, minutes] = journey.departure_time.split(':').map(Number);
    const departureDate = new Date(journey.arrival_date);
    departureDate.setHours(hours, minutes, 0);
    
    const diff = departureDate.getTime() - now.getTime();
    const minutesUntil = Math.floor(diff / (1000 * 60));
    
    if (minutesUntil < 0) return null;
    
    if (minutesUntil < 60) return `${minutesUntil}m`;
    const hoursUntil = Math.floor(minutesUntil / 60);
    const minsRemainder = minutesUntil % 60;
    return `${hoursUntil}h ${minsRemainder}m`;
  };

  const crowdingLevel = getAverageCrowding();
  const timeUntil = calculateTimeUntilDeparture();
  const transitSegments = journey.route_details.segments.filter((seg: any) => seg.mode === 'TRANSIT');
  const walkingSegments = journey.route_details.segments.filter((seg: any) => seg.mode === 'WALKING');
  const totalWalkTime = walkingSegments.reduce((sum: number, seg: any) => sum + seg.durationMinutes, 0);

  return (
    <>
      <div className={`glass-card p-6 rounded-[2rem] space-y-4 hover-lift relative overflow-hidden group shadow-xl ${
        !journey.is_active ? 'opacity-60' : ''
      }`}>
        {/* Background gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-lg text-foreground">{journey.destination}</h3>
              </div>
              <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
                {journey.is_active ? '● Activ' : '● Inactiv'}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/10">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-card border-white/10">
                <DropdownMenuItem onClick={() => onToggleActive(journey.id, journey.is_active)}>
                  <Power className="w-4 h-4 mr-2" />
                  {journey.is_active ? 'Dezactivează' : 'Activează'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(journey.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Șterge
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Arrival Time & Date */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Sosire la</p>
            <p className="text-4xl font-bold text-foreground">{journey.arrival_time}</p>
            <p className="text-sm text-muted-foreground mt-1">
              📅 {new Date(journey.arrival_date).toLocaleDateString('ro-RO', { 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>

          {/* Departure Countdown */}
          {timeUntil && journey.is_active && (
            <div className="glass p-5 rounded-3xl mb-4 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pleacă în</p>
                  <p className="text-3xl font-bold text-primary">{timeUntil}</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-primary" />
                </div>
              </div>
            </div>
          )}

          {/* Route Info */}
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

          {/* Crowding Indicator */}
          {crowdingLevel > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Aglomerație medie
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
            onClick={() => setShowDetails(true)}
            className="w-full gradient-primary h-14 text-base font-semibold group rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
            Vezi detalii
          </Button>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="glass-card max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalii traseu</DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-foreground">{journey.origin}</span> → <span className="font-semibold text-foreground">{journey.destination}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Summary */}
            <div className="glass p-4 rounded-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plecare</p>
                  <p className="text-lg font-bold text-primary">{journey.departure_time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sosire</p>
                  <p className="text-lg font-bold text-foreground">{journey.arrival_time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Durată</p>
                  <p className="text-lg font-bold text-foreground">{journey.estimated_duration} min</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distanță</p>
                  <p className="text-lg font-bold text-foreground">{journey.route_details.totalDistance}</p>
                </div>
              </div>
            </div>

            {/* Route Segments */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Pașii călătoriei</h4>
              {journey.route_details.segments.map((segment: any, idx: number) => (
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
                              {segment.crowdingLevel === 'high' ? '🔴' : 
                               segment.crowdingLevel === 'medium' ? '🟡' : 
                               '🟢'}
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default JourneyCard;
