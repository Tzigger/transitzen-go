import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin, Calendar, Bus, Navigation, Trash2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/convex";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { Id } from "../../convex/_generated/dataModel";

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId } = useAuth();
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);

  // Convex queries and mutations
  const journeysData = useQuery(api.journeys.getJourneys, userId ? { userId } : "skip");
  const journeys = journeysData || [];
  const deleteJourneyMutation = useMutation(api.journeys.deleteJourney);
  const updateJourneyStatus = useMutation(api.journeys.updateJourneyStatus);

  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  // Check for active journey in localStorage
  useEffect(() => {
    const storedJourney = localStorage.getItem('activeJourney');
    if (storedJourney) {
      try {
        const journey = JSON.parse(storedJourney);
        // Check if journey is still valid (not older than 24h)
        const journeyAge = Date.now() - (journey.startedAt || 0);
        if (journeyAge < 24 * 60 * 60 * 1000) {
          setActiveJourneyId(journey._id);
        } else {
          localStorage.removeItem('activeJourney');
        }
      } catch (error) {
        console.error('Error parsing active journey:', error);
        localStorage.removeItem('activeJourney');
      }
    }
  }, []);

  // Auto-complete finished journeys
  useEffect(() => {
    if (!journeys || journeys.length === 0) return;

    const checkAndCompleteJourneys = async () => {
      const now = new Date();
      
      for (const journey of journeys) {
        // Only check active journeys
        if (journey.status === 'active') {
          const arrivalDateTime = new Date(`${journey.arrivalDate}T${journey.arrivalTime}`);
          
          // If arrival time has passed, mark as completed
          if (arrivalDateTime <= now) {
            try {
              console.log(`🏁 Auto-completing journey ${journey._id} (arrived at ${journey.arrivalTime})`);
              await updateJourneyStatus({
                journeyId: journey._id,
                status: 'completed',
                isActive: false,
              });
              
              // Also clear from localStorage if it's there
              const storedJourney = localStorage.getItem('activeJourney');
              if (storedJourney) {
                const parsed = JSON.parse(storedJourney);
                if (parsed._id === journey._id) {
                  localStorage.removeItem('activeJourney');
                  setActiveJourneyId(null);
                }
              }
            } catch (error) {
              console.error('Error auto-completing journey:', error);
            }
          }
        }
      }
    };

    checkAndCompleteJourneys();
    
    // Check every minute
    const interval = setInterval(checkAndCompleteJourneys, 60000);
    
    return () => clearInterval(interval);
  }, [journeys, updateJourneyStatus]);

  const deleteJourney = async (id: Id<"journeys">) => {
    try {
      await deleteJourneyMutation({ journeyId: id });
      
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

  const handleStartJourney = async (journey: any) => {
    const startedAt = new Date().toISOString();

    try {
      await updateJourneyStatus({
        journeyId: journey._id,
        status: 'active',
        isActive: false,
      });
    } catch (error) {
      console.error('Error marking journey as active:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut porni călătoria automat",
        variant: "destructive",
      });
    }

    navigate('/active-journey', {
      state: {
        journey: {
          ...journey,
          status: 'active',
          startedAt: startedAt,
          isActive: false,
        },
      }
    });
  };

  const getStatusBadge = (journey: any) => {
    // Check if journey arrival time has passed
    const isFinished = !isUpcoming(journey.arrivalDate, journey.arrivalTime);
    
    // Debug log
    const arrivalDateTime = new Date(`${journey.arrivalDate}T${journey.arrivalTime}`);
    const now = new Date();
    console.log('📊 Status check:', {
      journeyId: journey._id,
      destination: journey.destination,
      arrivalDate: journey.arrivalDate,
      arrivalTime: journey.arrivalTime,
      arrivalDateTime: arrivalDateTime.toISOString(),
      now: now.toISOString(),
      isFinished,
      currentStatus: journey.status,
    });
    
    // If journey is marked as active but arrival time has passed, it should be completed
    if (journey.status === "active" && isFinished) {
      return {
        label: "Finalizată",
        className: "bg-muted/20 text-muted-foreground border-muted/30",
      };
    }
    
    switch (journey.status) {
      case "active":
        return {
          label: "În desfășurare",
          className: "bg-success/20 text-success border-success/30",
        };
      case "completed":
        return {
          label: "Finalizată",
          className: "bg-muted/20 text-muted-foreground border-muted/30",
        };
      case "cancelled":
        return {
          label: "Anulată",
          className: "bg-destructive/10 text-destructive border-destructive/30",
        };
      default:
        return {
          label: "Planificată",
          className: "bg-primary/20 text-primary border-primary/30",
        };
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 safe-area-top">
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
        {journeys && journeys.length > 0 && (
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
                  {journeys.filter(j => isUpcoming(j.arrivalDate, j.arrivalTime)).length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center mx-auto mb-2">
                  <Bus className="w-6 h-6 text-warning" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {journeys.reduce((acc, j) => acc + (j.estimatedDuration || 0), 0)}
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
              const upcoming = isUpcoming(journey.arrivalDate, journey.arrivalTime);
              const statusBadge = getStatusBadge(journey);
              
              return (
                <div 
                  key={journey._id}
                  className={`glass-card p-5 rounded-[2rem] hover-lift relative overflow-hidden group shadow-xl ${
                    activeJourneyId === journey._id ? 'ring-2 ring-success ring-opacity-50' : ''
                  }`}
                >
                  {/* Background gradient accent */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    activeJourneyId === journey._id 
                      ? 'from-success/10 to-transparent opacity-100' 
                      : upcoming 
                      ? 'from-primary/5' 
                      : 'from-success/5'
                  } to-transparent ${activeJourneyId === journey._id ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />
                  
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
                          className={`text-xs ${statusBadge.className}`}
                        >
                          ● {statusBadge.label}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteJourney(journey._id)}
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
                          {formatDate(journey.arrivalDate)}
                        </p>
                      </div>
                      
                      {journey.departureTime && (
                        <div className="glass p-3 rounded-xl border border-white/10">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Plecare</p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {journey.departureTime}
                          </p>
                        </div>
                      )}
                      
                      <div className="glass p-3 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Sosire</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {journey.arrivalTime}
                        </p>
                      </div>
                    </div>

                    {/* Route Info */}
                    {journey.routeDetails && journey.routeDetails.segments && (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          Ruta ({journey.estimatedDuration} min • {journey.routeDetails.totalDistance})
                        </p>
                        <div className="flex items-center gap-2 flex-wrap relative">
                          {journey.routeDetails.segments
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
                          
                          {/* LIVE Badge - Aligned with vehicle badges */}
                          {activeJourneyId === journey._id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartJourney(journey);
                              }}
                              className="ml-auto cursor-pointer hover:scale-110 transition-transform"
                            >
                              <Badge className="bg-success text-success-foreground animate-pulse hover:animate-none shadow-lg px-3 py-1.5">
                                🔴 LIVE
                              </Badge>
                            </button>
                          )}
                        </div>

                        {/* Start Journey Button - Only for upcoming journeys */}
                        {journey.status === 'scheduled' && upcoming && (
                          <Button 
                            onClick={() => handleStartJourney(journey)}
                            className={`w-full h-12 text-sm font-semibold rounded-full shadow-lg hover:shadow-xl transition-all group ${
                              activeJourneyId === journey._id 
                                ? 'bg-success hover:bg-success/90 animate-pulse-subtle border-2 border-success/30' 
                                : 'gradient-primary'
                            }`}
                          >
                            {activeJourneyId === journey._id ? (
                              <>
                                <Navigation className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                                Intră în Live View
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                                Pornește călătoria
                              </>
                            )}
                          </Button>
                        )}
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
