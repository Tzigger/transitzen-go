import { Button } from "@/components/ui/button";
import { Clock, MapPin, TrendingUp, Users, MoreVertical, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Journey {
  id: string;
  destination: string;
  arrivalTime: string;
  departureTime: string;
  departureMinutes: number;
  route: { type: 'bus' | 'tram'; number: string }[];
  walkTime: number;
  crowding: number;
  status: 'on-time' | 'delayed' | 'early';
}

interface JourneyCardProps {
  journey: Journey;
}

const JourneyCard = ({ journey }: JourneyCardProps) => {
  const getCrowdingColor = (level: number) => {
    if (level < 50) return 'bg-success';
    if (level < 80) return 'bg-warning';
    return 'bg-destructive';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'bg-success/20 text-success';
      case 'delayed': return 'bg-warning/20 text-warning';
      case 'early': return 'bg-primary/20 text-primary';
      default: return 'bg-muted/20 text-muted-foreground';
    }
  };

  const formatDepartureTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="glass-card p-6 rounded-[2rem] space-y-4 hover-lift relative overflow-hidden group shadow-xl">
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
            <Badge variant="outline" className={`text-xs ${getStatusColor(journey.status)}`}>
              {journey.status === 'on-time' && '● On time'}
              {journey.status === 'delayed' && '● Delayed'}
              {journey.status === 'early' && '● Early'}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-white/10">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* Arrival Time */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">Arrive by</p>
          <p className="text-4xl font-bold text-foreground">{journey.arrivalTime}</p>
        </div>

        {/* Departure Countdown */}
        <div className="glass p-5 rounded-3xl mb-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Leave in</p>
              <p className="text-3xl font-bold text-primary">{formatDepartureTime(journey.departureMinutes)}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Clock className="w-7 h-7 text-primary" />
            </div>
          </div>
        </div>

        {/* Route Info */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {journey.route.map((segment, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <div className="glass px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                <span className="text-sm">
                  {segment.type === 'bus' ? '🚍' : '🚊'}
                </span>
                <span className="text-sm font-semibold text-foreground">{segment.number}</span>
              </div>
              {idx < journey.route.length - 1 && (
                <TrendingUp className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
          ))}
          <div className="glass px-4 py-2 rounded-full text-xs text-muted-foreground border border-white/10">
            👣 {journey.walkTime} min
          </div>
        </div>

        {/* Crowding Indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Crowding
            </p>
            <span className="text-sm font-medium text-foreground">{journey.crowding}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getCrowdingColor(journey.crowding)} transition-all rounded-full`}
              style={{ width: `${journey.crowding}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <Button className="w-full gradient-primary h-14 text-base font-semibold group rounded-full shadow-lg hover:shadow-xl transition-all">
          <Play className="w-5 h-5 mr-2 group-hover:animate-pulse" />
          Start Journey
        </Button>
      </div>
    </div>
  );
};

export default JourneyCard;
