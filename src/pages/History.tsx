import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";

interface CompletedJourney {
  id: string;
  destination: string;
  completedAt: string;
  date: string;
  duration: string;
  route: { type: 'bus' | 'tram'; number: string }[];
  walkTime: number;
}

const History = () => {
  const navigate = useNavigate();

  // Mock data for completed journeys
  const completedJourneys: CompletedJourney[] = [
    {
      id: '1',
      destination: 'Universitate',
      completedAt: '10:45',
      date: 'Azi',
      duration: '25 min',
      route: [
        { type: 'bus', number: '41' },
        { type: 'tram', number: '1' }
      ],
      walkTime: 5,
    },
    {
      id: '2',
      destination: 'Piața Unirii',
      completedAt: '08:30',
      date: 'Azi',
      duration: '18 min',
      route: [
        { type: 'bus', number: '123' }
      ],
      walkTime: 3,
    },
    {
      id: '3',
      destination: 'Piața Victoriei',
      completedAt: '19:15',
      date: 'Ieri',
      duration: '32 min',
      route: [
        { type: 'tram', number: '41' },
        { type: 'bus', number: '232' }
      ],
      walkTime: 8,
    },
    {
      id: '4',
      destination: 'Obor',
      completedAt: '14:20',
      date: 'Ieri',
      duration: '28 min',
      route: [
        { type: 'bus', number: '330' }
      ],
      walkTime: 6,
    },
    {
      id: '5',
      destination: 'Cotroceni',
      completedAt: '11:00',
      date: '15 Oct',
      duration: '22 min',
      route: [
        { type: 'tram', number: '1' }
      ],
      walkTime: 4,
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-4 z-40 px-4 mb-6">
        <div className="glass-card backdrop-blur-xl rounded-[2rem] shadow-2xl max-w-md mx-auto">
          <div className="px-6 py-4 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Istoric Rute</h1>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-4 max-w-md mx-auto">
        {/* Stats */}
        <div className="glass-card p-5 rounded-[2rem] shadow-xl">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{completedJourneys.length}</p>
              <p className="text-xs text-muted-foreground">Rute</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">2.3h</p>
              <p className="text-xs text-muted-foreground">Economisiți</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-6 h-6 text-warning" />
              </div>
              <p className="text-2xl font-bold text-foreground">12km</p>
              <p className="text-xs text-muted-foreground">Parcurși</p>
            </div>
          </div>
        </div>

        {/* Journey List */}
        <div className="space-y-3 pb-4">
          {completedJourneys.map((journey) => (
            <div 
              key={journey.id}
              className="glass-card p-5 rounded-[2rem] hover-lift relative overflow-hidden group shadow-xl"
            >
            {/* Background gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-lg text-foreground">{journey.destination}</h3>
                  </div>
                  <Badge variant="outline" className="text-xs bg-success/20 text-success border-success/30">
                    ● Completată
                  </Badge>
                </div>
              </div>

              {/* Time Info */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="glass p-3 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Data</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{journey.date}</p>
                </div>
                <div className="glass p-3 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Oră</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{journey.completedAt}</p>
                </div>
                <div className="glass p-3 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Durată</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{journey.duration}</p>
                </div>
              </div>

              {/* Route Info */}
              <div className="flex items-center gap-2 flex-wrap">
                {journey.route.map((segment, idx) => (
                  <div key={idx} className="glass px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                    <span className="text-sm">
                      {segment.type === 'bus' ? '🚍' : '🚊'}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{segment.number}</span>
                  </div>
                ))}
                <div className="glass px-3 py-1.5 rounded-full text-xs text-muted-foreground border border-white/10">
                  👣 {journey.walkTime} min
                </div>
              </div>
            </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade for nav bar */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-40" />

      <BottomNav />
    </div>
  );
};

export default History;
