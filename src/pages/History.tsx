import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin, Calendar, Bus, Navigation, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Journey {
  id: string;
  origin: string;
  destination: string;
  arrival_date: string;
  arrival_time: string;
  departure_time: string | null;
  estimated_duration: number | null;
  route_details: any;
  is_active: boolean;
  created_at: string;
}

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJourneys();
  }, []);

  const fetchJourneys = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching journeys:', error);
        throw error;
      }

      setJourneys(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut încărca călătoriile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteJourney = async (id: string) => {
    try {
      const { error } = await supabase
        .from('journeys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setJourneys(journeys.filter(j => j.id !== id));
      
      toast({
        title: "Șters",
        description: "Călătoria a fost ștearsă",
      });
    } catch (error) {
      console.error('Error deleting journey:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut șterge călătoria",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Azi";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ieri";
    } else {
      return date.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" });
    }
  };

  const isUpcoming = (dateStr: string, timeStr: string) => {
    const journeyDate = new Date(`${dateStr}T${timeStr}`);
    return journeyDate > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-foreground">Călătoriile mele</h1>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-4 max-w-md mx-auto">
        {/* Stats */}
        {journeys.length > 0 && (
          <div className="glass-card p-5 rounded-[2rem] shadow-xl">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{journeys.length}</p>
                <p className="text-xs text-muted-foreground">Călătorii</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-success" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {journeys.filter(j => isUpcoming(j.arrival_date, j.arrival_time)).length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center mx-auto mb-2">
                  <Bus className="w-6 h-6 text-warning" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {journeys.reduce((acc, j) => acc + (j.estimated_duration || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Min planificate</p>
              </div>
            </div>
          </div>
        )}

        {/* Journey List */}
        {journeys.length === 0 ? (
          <div className="glass-card p-8 rounded-[2rem] text-center shadow-xl">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nicio călătorie planificată
            </h3>
            <p className="text-muted-foreground mb-4">
              Planifică-ți prima călătorie pentru a vedea detaliile aici
            </p>
            <Button 
              onClick={() => navigate('/create-journey')}
              className="bg-primary hover:bg-primary/90"
            >
              Planifică călătorie
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {journeys.map((journey) => {
              const upcoming = isUpcoming(journey.arrival_date, journey.arrival_time);
              
              return (
                <div 
                  key={journey.id}
                  className="glass-card p-5 rounded-[2rem] hover-lift relative overflow-hidden group shadow-xl"
                >
                  {/* Background gradient accent */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    upcoming ? 'from-primary/5' : 'from-success/5'
                  } to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                  
                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Navigation className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{journey.origin}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          <h3 className="font-bold text-lg text-foreground">{journey.destination}</h3>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            upcoming 
                              ? 'bg-primary/20 text-primary border-primary/30' 
                              : 'bg-success/20 text-success border-success/30'
                          }`}
                        >
                          ● {upcoming ? 'Planificată' : 'Trecută'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteJourney(journey.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Time Info */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="glass p-3 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Data</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatDate(journey.arrival_date)}
                        </p>
                      </div>
                      
                      {journey.departure_time && (
                        <div className="glass p-3 rounded-xl border border-white/10">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Plecare</p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {journey.departure_time}
                          </p>
                        </div>
                      )}
                      
                      <div className="glass p-3 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Sosire</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {journey.arrival_time}
                        </p>
                      </div>
                    </div>

                    {/* Route Info */}
                    {journey.route_details && journey.route_details.segments && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground mb-2">
                          Ruta ({journey.estimated_duration} min • {journey.route_details.totalDistance})
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {journey.route_details.segments
                            .filter(seg => seg.mode === 'TRANSIT' && seg.vehicle)
                            .map((segment, idx) => (
                              <div 
                                key={idx} 
                                className="glass px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10"
                              >
                                <Bus className="w-3 h-3 text-primary" />
                                <span className="text-sm font-semibold text-foreground">
                                  {segment.vehicle?.type} {segment.vehicle?.line}
                                </span>
                                {segment.stops && (
                                  <span className="text-xs text-muted-foreground">
                                    • {segment.stops} stații
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom fade for nav bar */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-40" />

      <BottomNav />
    </div>
  );
};

export default History;
