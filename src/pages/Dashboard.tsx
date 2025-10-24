import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Bell, Settings, Map, Clock, TrendingUp, Users, Zap, Leaf, Wallet, Route, AlertTriangle, CheckCircle, Info, ChevronRight, Navigation } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/convex";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import TicketSelector from "@/components/TicketSelector";

const Dashboard = () => {
  const navigate = useNavigate();
  const { userId, email } = useAuth();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Bună dimineața" : currentHour < 18 ? "Bună ziua" : "Bună seara";
  const [userName, setUserName] = useState<string>("");
  const [activeJourney, setActiveJourney] = useState<any>(null);

  // Convex queries
  const profile = useQuery(api.profiles.getProfile, userId ? { userId } : "skip");

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (profile && profile.firstName) {
      setUserName(profile.firstName);
    } else if (email) {
      setUserName(email.split('@')[0] || 'Utilizator');
    }
  }, [profile, email]);

  // Check for active journey in localStorage
  useEffect(() => {
    const storedJourney = localStorage.getItem('activeJourney');
    if (storedJourney) {
      try {
        const journey = JSON.parse(storedJourney);
        // Check if journey is still valid (not older than 24h)
        const journeyAge = Date.now() - (journey.startedAt || 0);
        if (journeyAge < 24 * 60 * 60 * 1000) {
          setActiveJourney(journey);
        } else {
          // Clear old journey
          localStorage.removeItem('activeJourney');
        }
      } catch (error) {
        console.error('Error parsing active journey:', error);
        localStorage.removeItem('activeJourney');
      }
    }
  }, []);

  const tips = [
    { icon: Zap, title: "Pleacă cu 5 min mai devreme", desc: "Evită stresul de a prinde autobuzul" },
    { icon: AlertTriangle, title: "Verifică traficul live", desc: "Înainte de a pleca vezi statusul în timp real" },
    { icon: CheckCircle, title: "Salvează rute frecvente", desc: "Acces rapid la destinațiile tale favorite" },
  ];

  const popularRoutes = [
    { id: 1, from: "Centru", to: "Universitate", time: "25 min", emoji: "🎓" },
    { id: 2, from: "Gară", to: "Palas", time: "18 min", emoji: "🛍️" },
    { id: 3, from: "Tudor", to: "Copou", time: "32 min", emoji: "🏛️" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Main Content */}
      <div className="px-4 pt-6 space-y-6 max-w-md mx-auto">
        {/* Welcome Section */}
        <div className="glass-card p-6 rounded-[2rem] shadow-xl animate-slide-up">
          <h2 className="text-3xl font-bold text-foreground mb-2">{greeting}, {userName}! 👋</h2>
          <p className="text-muted-foreground">Hai să planificăm următoarea ta călătorie</p>
        </div>

        {/* Ticket Selector */}
        <TicketSelector />

        {/* Active Journey Card */}
        {activeJourney && (
          <div 
            onClick={() => navigate('/active-journey', { state: { journey: activeJourney } })}
            className="glass-card p-6 rounded-[2rem] shadow-xl border-2 border-primary/30 cursor-pointer hover-lift animate-pulse-subtle"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
                  <Navigation className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Călătorie activă</h3>
                  <p className="text-sm text-muted-foreground">Atingi pentru a continua</p>
                </div>
              </div>
              <Badge variant="default" className="bg-primary">
                Live
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Destinație</p>
                  <p className="font-semibold text-foreground">{activeJourney.destination}</p>
                </div>
              </div>
              
              {activeJourney.progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progres</span>
                    <span>{Math.round(activeJourney.progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${activeJourney.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Început la {new Date(activeJourney.startedAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <ChevronRight className="w-5 h-5 text-primary" />
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-5 rounded-3xl hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">2.5h</p>
            <p className="text-xs text-muted-foreground mt-1">Timp salvat săptămâna asta</p>
          </div>
          
          <div className="glass-card p-5 rounded-3xl hover-lift">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">28</p>
            <p className="text-xs text-muted-foreground mt-1">Călătorii luna aceasta</p>
          </div>
        </div>

        {/* Plan Your Trip - CTA */}
        <Button 
          onClick={() => navigate('/create-journey')}
          className="w-full h-20 gradient-primary rounded-[2rem] shadow-2xl hover:shadow-xl transition-all hover:scale-[1.02] text-lg font-semibold"
        >
          <Navigation className="w-6 h-6 mr-2" />
          Planifică călătoria
        </Button>

        {/* Traffic Status */}
        <div className="glass-card p-5 rounded-[2rem] shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Trafic în oraș</h3>
                <p className="text-xs text-muted-foreground">Actualizat acum 2 min</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
              Moderat
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 glass rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚍</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Autobuze</p>
                  <p className="text-xs text-muted-foreground">Întârzieri minore</p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            </div>

            <div className="flex items-center justify-between p-3 glass rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">🚊</span>
                <div>
                  <p className="text-sm font-medium text-foreground">Tramvaie</p>
                  <p className="text-xs text-muted-foreground">Program normal</p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Sfaturi utile</h3>
          </div>
          
          {tips.map((tip, idx) => {
            const TipIcon = tip.icon;
            return (
              <div key={idx} className="glass-card p-4 rounded-2xl flex items-start gap-3 hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TipIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{tip.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tip.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Popular Routes */}
        <div className="space-y-3 pb-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-semibold text-foreground">Rute populare</h3>
            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-full">
              Vezi toate
            </Button>
          </div>

          {popularRoutes.map((route) => (
            <button
              key={route.id}
              onClick={() => navigate('/create-journey')}
              className="w-full glass-card p-4 rounded-2xl hover:bg-white/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{route.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">{route.from}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{route.to}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">~{route.time}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom fade for nav bar */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-40" />

      <BottomNav />
    </div>
  );
};

export default Dashboard;
