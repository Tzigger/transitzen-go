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
import { useAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/hooks/use-toast";

interface FavoriteRoute {
  _id: string;
  userId: string;
  name: string;
  origin: string;
  originLat: number;
  originLng: number;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  routeInfo?: {
    totalDuration?: number;
    totalDistance?: string;
    segments?: any[];
    averageCrowding?: number;
  };
  _creationTime: number;
}

const Journeys = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  // Convex queries and mutations
  const routes = useQuery(api.favoriteRoutes.getFavoriteRoutes, userId ? { userId } : "skip");
  const deleteRouteMutation = useMutation(api.favoriteRoutes.deleteFavoriteRoute);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  const handleDeleteRoute = async (routeId: string) => {
    try {
      await deleteRouteMutation({ routeId: routeId as any });

      toast({
        title: "Succes",
        description: "Traseu șters cu succes",
      });
    } catch (error) {
      console.error('Error deleting route:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut șterge traseul",
        variant: "destructive",
      });
    }
  };

  const handlePlanJourney = (route: FavoriteRoute) => {
    // Navigate to create-journey with pre-filled data
    navigate('/create-journey', {
      state: {
        prefilledOrigin: route.origin,
        prefilledOriginCoords: { lat: route.originLat, lng: route.originLng },
        prefilledDestination: route.destination,
        prefilledDestinationCoords: { lat: route.destinationLat, lng: route.destinationLng },
      }
    });
  };

  const filteredRoutes = (routes || []).filter(route =>
    route.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    switch (sortBy) {
      case 'destination':
        return a.destination.localeCompare(b.destination);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'recent':
      default:
        return b._creationTime - a._creationTime;
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
            <h1 className="text-xl font-bold text-foreground flex-1">Trasee favorite</h1>
            <Button 
              onClick={() => navigate('/create-journey')}
              size="sm" 
              className="gradient-primary rounded-full px-4 h-10 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adaugă
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-4 max-w-md mx-auto">
        {/* Stats Summary */}
        <div className="glass-card p-5 rounded-[2rem] shadow-xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{(routes || []).length}</p>
              <p className="text-xs text-muted-foreground">Trasee salvate</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {(routes || []).filter(r => r.routeInfo).length}
              </p>
              <p className="text-xs text-muted-foreground">Cu rute calculate</p>
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
                <SelectItem value="name">Nume A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Routes List */}
        <div className="space-y-3 pb-4">
          {!routes ? (
            <div className="glass-card p-8 rounded-[2rem] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Se încarcă traseele...</p>
            </div>
          ) : sortedRoutes.length > 0 ? (
            sortedRoutes.map((route) => (
              <JourneyCard 
                key={route._id} 
                route={route as any}
                onPlanJourney={handlePlanJourney}
                onDelete={handleDeleteRoute}
              />
            ))
          ) : (
            <div className="glass-card p-8 rounded-[2rem] text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nu s-au găsit trasee favorite
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? "Încearcă să schimbi criteriile de căutare"
                  : "Salvează primul tău traseu favorit pentru acces rapid"}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => navigate('/create-journey')}
                  className="gradient-primary rounded-full px-6 h-12 shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adaugă traseu favorit
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
