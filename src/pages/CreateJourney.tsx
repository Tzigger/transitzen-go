import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, MapPin, Clock, Bell, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CreateJourney = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [destination, setDestination] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [date, setDate] = useState("");
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [notifyDeparture, setNotifyDeparture] = useState(true);
  const [notifyDelays, setNotifyDelays] = useState(true);
  const [notifyCrowding, setNotifyCrowding] = useState(false);
  const [notifyRouteChanges, setNotifyRouteChanges] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Swipe to close
  const [touchStart, setTouchStart] = useState(0);
  const [touchCurrent, setTouchCurrent] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 10) return;
    setTouchStart(e.touches[0].clientY);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentTouch = e.touches[0].clientY;
    const diff = currentTouch - touchStart;
    
    if (diff > 0) {
      setTouchCurrent(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    
    if (touchCurrent > 150) {
      navigate(-1);
    }
    
    setIsSwiping(false);
    setTouchCurrent(0);
    setTouchStart(0);
  };

  const swipeProgress = isSwiping ? Math.min(touchCurrent / 150, 1) : 0;

  const toggleRecurringDay = (dayIndex: number) => {
    setRecurringDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleSaveJourney = async () => {
    if (!destination.trim()) {
      toast({
        title: "Eroare",
        description: "Te rog introdu o destinație",
        variant: "destructive",
      });
      return;
    }

    if (!date) {
      toast({
        title: "Eroare",
        description: "Te rog selectează o dată",
        variant: "destructive",
      });
      return;
    }

    if (!arrivalTime) {
      toast({
        title: "Eroare",
        description: "Te rog selectează ora sosirii",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Eroare",
          description: "Trebuie să fii autentificat",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const { error } = await supabase.from('journeys').insert({
        user_id: user.id,
        destination: destination.trim(),
        arrival_date: date,
        arrival_time: arrivalTime,
        recurring_days: recurringDays,
        notify_departure: notifyDeparture,
        notify_delays: notifyDelays,
        notify_crowding: notifyCrowding,
        notify_route_changes: notifyRouteChanges,
        is_active: true,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Alerta ta a fost activată cu succes",
      });

      navigate('/journeys');
    } catch (error) {
      console.error('Error saving journey:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut salva alerta. Te rog încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="min-h-screen gradient-dark pb-24 transition-transform"
      style={{
        transform: `translateY(${touchCurrent}px)`,
        opacity: 1 - swipeProgress * 0.3,
        transition: isSwiping ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className="sticky top-4 z-40 px-4 mb-8">
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
            <h1 className="text-xl font-bold text-foreground">Create Journey</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="px-4 space-y-6 animate-slide-up max-w-md mx-auto">
        {/* Destination */}
        <div className="glass-card p-6 rounded-[2rem] space-y-4 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Destination</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination" className="text-muted-foreground text-sm">Where do you want to go?</Label>
            <Input 
              id="destination"
              placeholder="Search address or place..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="h-14 glass border-white/20 text-foreground placeholder:text-muted-foreground rounded-2xl"
            />
          </div>

          <Button variant="outline" className="w-full glass hover:glass-strong h-12 rounded-full">
            📍 Use current location
          </Button>
        </div>

        {/* Timing */}
        <div className="glass-card p-6 rounded-[2rem] space-y-4 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">When</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-muted-foreground text-sm">Date</Label>
              <Input 
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-14 glass border-white/20 text-foreground rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-muted-foreground text-sm">I want to arrive at</Label>
              <Input 
                id="time"
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                className="h-16 glass border-white/20 text-foreground text-3xl font-bold rounded-2xl"
              />
            </div>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/10">
            <p className="text-sm text-muted-foreground mb-3">Recurring schedule</p>
            <div className="flex gap-2 justify-between">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleRecurringDay(idx)}
                  className={`w-11 h-11 rounded-full glass-card hover:glass-strong text-sm font-medium transition-all ${
                    recurringDays.includes(idx) 
                      ? 'bg-primary/30 text-primary border-primary/50' 
                      : 'hover:text-primary hover:bg-primary/20'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card p-6 rounded-[2rem] space-y-4 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Notificări</h2>
              <p className="text-sm text-muted-foreground">Configurează alertele tale</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground mt-2">Setări notificări</h3>
            
            <div className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">Alerte de plecare</p>
                <p className="text-sm text-muted-foreground">
                  Primește notificări când să pleci
                </p>
              </div>
              <Switch 
                checked={notifyDeparture}
                onCheckedChange={setNotifyDeparture}
                className="data-[state=checked]:bg-primary" 
              />
            </div>

            <div className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">Întârzieri</p>
                <p className="text-sm text-muted-foreground">
                  Notificări pentru întârzieri
                </p>
              </div>
              <Switch 
                checked={notifyDelays}
                onCheckedChange={setNotifyDelays}
                className="data-[state=checked]:bg-primary" 
              />
            </div>

            <div className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">Aglomerație</p>
                <p className="text-sm text-muted-foreground">
                  Alertă pentru vehicule aglomerate
                </p>
              </div>
              <Switch 
                checked={notifyCrowding}
                onCheckedChange={setNotifyCrowding}
                className="data-[state=checked]:bg-primary" 
              />
            </div>

            <div className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">Modificări rute</p>
                <p className="text-sm text-muted-foreground">
                  Notificări pentru rutele tale favorite
                </p>
              </div>
              <Switch 
                checked={notifyRouteChanges}
                onCheckedChange={setNotifyRouteChanges}
                className="data-[state=checked]:bg-primary" 
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="glass-card p-6 rounded-[2rem] space-y-4 shadow-xl">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Alertă pentru ora sosirii
            </h2>
            <p className="text-sm text-muted-foreground">
              Setează ora la care vrei să ajungi și primești o notificare când să pleci
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dest-confirm" className="text-sm text-muted-foreground">
              Destinație
            </Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <Input
                id="dest-confirm"
                value={destination || "Selectează destinația"}
                readOnly
                className="h-14 glass border-white/20 text-foreground rounded-2xl pl-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-confirm" className="text-sm text-muted-foreground">
              Ora sosirii
            </Label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <Input
                id="time-confirm"
                value={arrivalTime || "00:00"}
                readOnly
                className="h-14 glass border-white/20 text-foreground rounded-2xl pl-12"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSaveJourney}
          disabled={isSaving}
          className="w-full h-16 text-lg font-semibold gradient-primary shadow-2xl rounded-full mb-4 hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? 'Se salvează...' : 'Activează alertă'}
        </Button>
      </div>

      {/* Bottom fade for nav bar */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-40" />

      <BottomNav />
    </div>
  );
};

export default CreateJourney;
