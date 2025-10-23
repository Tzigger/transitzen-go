import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Search, Filter, Calendar, MapPin } from "lucide-react";
import JourneyCard from "@/components/JourneyCard";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  notify_departure: boolean;
  notify_delays: boolean;
  notify_crowding: boolean;
  notify_route_changes: boolean;
  created_at: string;
}

const Journeys = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

      if (error) throw error;

      setJourneys((data || []) as unknown as Journey[]);
    } catch (error) {
      console.error('Error fetching journeys:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut încărca traseele tale",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (journeyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('journeys')
        .update({ is_active: !isActive })
        .eq('id', journeyId);

      if (error) throw error;

      setJourneys(journeys.map(j => 
        j.id === journeyId ? { ...j, is_active: !isActive } : j
      ));

      toast({
        title: "Succes",
        description: `Traseu ${!isActive ? 'activat' : 'dezactivat'}`,
      });
    } catch (error) {
      console.error('Error toggling journey:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut actualiza traseul",
        variant: "destructive",
      });
    }
  };

  const handleDeleteJourney = async (journeyId: string) => {
    try {
      const { error } = await supabase
        .from('journeys')
        .delete()
        .eq('id', journeyId);

      if (error) throw error;

      setJourneys(journeys.filter(j => j.id !== journeyId));

      toast({
        title: "Succes",
        description: "Traseu șters cu succes",
      });
    } catch (error) {
      console.error('Error deleting journey:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut șterge traseul",
        variant: "destructive",
      });
    }
  };

  const filteredJourneys = journeys.filter(journey =>
    journey.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedJourneys = [...filteredJourneys].sort((a, b) => {
    switch (sortBy) {
      case 'destination':
        return a.destination.localeCompare(b.destination);
      case 'time':
        return (a.arrival_time || '').localeCompare(b.arrival_time || '');
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

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
            <h1 className="text-xl font-bold text-foreground flex-1">Traseele mele</h1>
            <Button 
              onClick={() => navigate('/create-journey')}
              size="sm" 
              className="gradient-primary rounded-full px-4 h-10 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nou
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-4 max-w-md mx-auto">
        {/* Stats Summary */}
        <div className="glass-card p-5 rounded-[2rem] shadow-xl">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{journeys.length}</p>
              <p className="text-xs text-muted-foreground">Trasee</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {journeys.filter(j => j.is_active).length}
              </p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center mx-auto mb-2">
                <Filter className="w-6 h-6 text-warning" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {journeys.filter(j => !j.is_active).length}
              </p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="glass-card p-4 rounded-[2rem] shadow-xl space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Caută destinație..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-12 glass border-white/10 rounded-2xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="glass border-white/10 rounded-2xl h-11">
                <SelectValue placeholder="Sortează după" />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/10">
                <SelectItem value="recent">Cele mai recente</SelectItem>
                <SelectItem value="destination">Destinație A-Z</SelectItem>
                <SelectItem value="time">Oră plecare</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Journeys List */}
        <div className="space-y-3 pb-4">
          {isLoading ? (
            <div className="glass-card p-8 rounded-[2rem] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Se încarcă traseele...</p>
            </div>
          ) : sortedJourneys.length > 0 ? (
            sortedJourneys.map((journey) => (
              <JourneyCard 
                key={journey.id} 
                journey={journey}
                onToggleActive={handleToggleActive}
                onDelete={handleDeleteJourney}
              />
            ))
          ) : (
            <div className="glass-card p-8 rounded-[2rem] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nu s-au găsit trasee
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? "Încearcă să schimbi criteriile de căutare"
                  : "Adaugă primul tău traseu pentru a începe"}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => navigate('/create-journey')}
                  className="gradient-primary rounded-full px-6 h-12 shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Creează traseu
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom fade for nav bar */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-40" />

      <BottomNav />
    </div>
  );
};

export default Journeys;
