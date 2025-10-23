import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Navigation, MapPin, Clock, AlertCircle, Phone, Share2, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import ActiveJourneyMap from "@/components/ActiveJourneyMap";

interface JourneyStep {
  type: 'WALKING' | 'TRANSIT';
  mode?: string;
  vehicle?: {
    type: string;
    line: string;
    name: string;
  };
  from: string;
  to: string;
  departureStop?: string;
  arrivalStop?: string;
  distance?: string;
  duration?: string;
  durationMinutes?: number;
  stops?: number;
  completed?: boolean;
  isActive?: boolean;
}

const ActiveJourney = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const journeyData = location.state as {
    journey: any;
  } | null;

  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [steps, setSteps] = useState<JourneyStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number>(0);
  const [showStopAlert, setShowStopAlert] = useState(false);
  const [nextStop, setNextStop] = useState<string>("");
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!journeyData) {
      console.error('❌ No journey data provided to ActiveJourney');
      toast({
        title: "Eroare",
        description: "Nu există date despre călătorie",
        variant: "destructive",
      });
      navigate('/history');
      return;
    }

    console.log('✅ ActiveJourney initialized with data:', {
      destination: journeyData.journey.destination,
      origin_lat: journeyData.journey.origin_lat,
      origin_lng: journeyData.journey.origin_lng,
      destination_lat: journeyData.journey.destination_lat,
      destination_lng: journeyData.journey.destination_lng,
      route_details: journeyData.journey.route_details,
      segments: journeyData.journey.route_details?.segments?.length || 0,
    });

    // Initialize steps from journey data
    const segments = journeyData.journey.route_details?.segments || [];
    
    if (segments.length === 0) {
      console.warn('⚠️ No route segments found, creating default walking segment');
      // Create a default walking segment if no segments exist
      const defaultSegment = {
        type: 'WALKING',
        from: journeyData.journey.origin || 'Pornire',
        to: journeyData.journey.destination,
        distance: '1 km',
        duration: '15 min',
        durationMinutes: 15,
        completed: false,
        isActive: true,
      };
      setSteps([defaultSegment]);
    } else {
      const initialSteps: JourneyStep[] = segments.map((seg: any, idx: number) => ({
        ...seg,
        completed: false,
        isActive: idx === 0,
      }));
      setSteps(initialSteps);
    }
    
    setEstimatedTimeRemaining(journeyData.journey.estimated_duration || 0);

    // Start location tracking
    startTracking();

    return () => {
      stopTracking();
    };
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Eroare",
        description: "Browser-ul tău nu suportă geolocalizare",
        variant: "destructive",
      });
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(newLocation);
        
        // Check proximity to next stop
        checkProximityToStop(newLocation);
      },
      (error) => {
        console.error('Error tracking location:', error);
        toast({
          title: "Eroare tracking",
          description: "Nu am putut urmări locația ta",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const checkProximityToStop = (location: {lat: number, lng: number}) => {
    if (!steps[currentStepIndex] || steps[currentStepIndex].type !== 'TRANSIT') return;

    const currentStep = steps[currentStepIndex];
    // In a real app, you would check the actual stop coordinates
    // For now, we'll simulate based on time/progress
    
    // Simulate proximity check - in reality, compare with stop coordinates
    if (progress > 80 && !showStopAlert) {
      setShowStopAlert(true);
      setNextStop(currentStep.to || "");
      
      // Show notification
      toast({
        title: "🔔 Coboară în curând!",
        description: `Pregătește-te să cobori la ${currentStep.to}`,
      });

      // Play notification sound if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Coboară în curând!', {
          body: `Pregătește-te să cobori la ${currentStep.to}`,
          icon: '/favicon.ico',
        });
      }
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const completeCurrentStep = () => {
    const newSteps = [...steps];
    newSteps[currentStepIndex].completed = true;
    newSteps[currentStepIndex].isActive = false;
    
    if (currentStepIndex < steps.length - 1) {
      newSteps[currentStepIndex + 1].isActive = true;
      setCurrentStepIndex(currentStepIndex + 1);
      setShowStopAlert(false);
    } else {
      // Journey completed
      toast({
        title: "🎉 Călătorie completată!",
        description: "Ai ajuns la destinație",
      });
      navigate('/history');
      return;
    }
    
    setSteps(newSteps);
    
    // Recalculate progress
    const completedSteps = newSteps.filter(s => s.completed).length;
    const newProgress = (completedSteps / newSteps.length) * 100;
    setProgress(newProgress);
  };

  const handleEndJourney = () => {
    stopTracking();
    toast({
      title: "Călătorie oprită",
      description: "Tracking-ul a fost oprit",
    });
    navigate('/history');
  };

  const handleEmergency = () => {
    window.location.href = 'tel:112';
  };

  const handleShareLocation = async () => {
    if (currentLocation && navigator.share) {
      try {
        await navigator.share({
          title: 'Locația mea curentă',
          text: `Sunt în călătorie spre ${journeyData?.journey.destination}`,
          url: `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      toast({
        title: "Info",
        description: "Partajarea nu este suportată pe acest dispozitiv",
      });
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Simulate progress (in real app, calculate based on actual location)
  useEffect(() => {
    if (!isTracking) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 0.5; // Increment slowly
      });
      
      setEstimatedTimeRemaining(prev => {
        if (prev <= 0) return 0;
        return prev - 0.5;
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isTracking]);

  if (!journeyData) {
    return null;
  }

  const currentStep = steps[currentStepIndex];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="absolute top-4 left-4 right-4 z-50">
        <div className="glass-card backdrop-blur-xl rounded-[2rem] shadow-2xl">
          <div className="px-4 py-3 flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex-1 text-center">
              <p className="text-xs text-muted-foreground">În călătorie spre</p>
              <h1 className="text-sm font-bold text-foreground truncate">
                {journeyData.journey.destination}
              </h1>
            </div>

            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleEndJourney}
              className="rounded-full hover:bg-destructive/10 text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="h-[50vh]">
        {journeyData?.journey?.origin_lat && journeyData?.journey?.destination_lat ? (
          <ActiveJourneyMap 
            currentLocation={currentLocation}
            journeySteps={steps}
            origin={{
              lat: journeyData.journey.origin_lat,
              lng: journeyData.journey.origin_lng,
            }}
            destination={{
              lat: journeyData.journey.destination_lat,
              lng: journeyData.journey.destination_lng,
            }}
            routeSegments={journeyData.journey.route_details?.segments || []}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/20">
            <div className="text-center p-6">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nu sunt disponibile coordonate pentru hartă
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 max-h-[55vh] overflow-y-auto bg-background rounded-t-[2rem] shadow-2xl">
        <div className="px-4 pt-6 pb-24 space-y-4">
          {/* Progress Bar */}
          <Card className="glass-card p-4 rounded-[2rem]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Progres călătorie</p>
                <p className="text-2xl font-bold text-foreground">{Math.round(progress)}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Timp rămas</p>
                <p className="text-2xl font-bold text-foreground">{Math.round(estimatedTimeRemaining)} min</p>
              </div>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
          </Card>

          {/* Stop Alert */}
          {showStopAlert && (
            <Card className="glass-card p-4 rounded-[2rem] border-2 border-warning bg-warning/10 animate-pulse">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-warning flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-foreground">Coboară în curând!</p>
                  <p className="text-sm text-muted-foreground">Următoarea oprire: {nextStop}</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={completeCurrentStep}
                  className="bg-warning hover:bg-warning/90 text-background rounded-full"
                >
                  Am coborât
                </Button>
              </div>
            </Card>
          )}

          {/* Current Step */}
          {currentStep && (
            <Card className="glass-card p-5 rounded-[2rem] border-2 border-primary">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {currentStep.type === 'TRANSIT' ? (
                    <span className="text-2xl">
                      {currentStep.vehicle?.type === 'BUS' ? '🚍' : '🚊'}
                    </span>
                  ) : (
                    <Navigation className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <Badge className="bg-primary/20 text-primary border-primary/30 mb-2">
                    Pas curent
                  </Badge>
                  {currentStep.type === 'TRANSIT' ? (
                    <>
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        {currentStep.vehicle?.type} {currentStep.vehicle?.line}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {currentStep.vehicle?.name}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-success"></span>
                          <span className="text-foreground">{currentStep.from}</span>
                        </p>
                        <p className="pl-4 text-muted-foreground">
                          {currentStep.stops} {currentStep.stops === 1 ? 'oprire' : 'opriri'}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-destructive"></span>
                          <span className="text-foreground">{currentStep.to}</span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-foreground mb-1">
                        🚶 Mers pe jos
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {currentStep.distance} • {currentStep.duration}
                      </p>
                    </>
                  )}
                </div>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={completeCurrentStep}
                  className="rounded-full"
                >
                  Finalizat
                </Button>
              </div>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="glass-card p-4 rounded-[2rem]">
            <h3 className="font-semibold text-foreground mb-3">Pași următori</h3>
            <div className="space-y-2">
              {steps.slice(currentStepIndex + 1, currentStepIndex + 3).map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 glass rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-sm">
                    {currentStepIndex + idx + 2}
                  </div>
                  <div className="flex-1 min-w-0">
                    {step.type === 'TRANSIT' ? (
                      <>
                        <p className="text-sm font-semibold text-foreground truncate">
                          {step.vehicle?.type} {step.vehicle?.line}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {step.from} → {step.to}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground">Mers pe jos</p>
                        <p className="text-xs text-muted-foreground">{step.duration}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Emergency Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleEmergency}
              variant="outline"
              className="h-14 rounded-full border-destructive/30 hover:bg-destructive/10"
            >
              <Phone className="w-5 h-5 mr-2 text-destructive" />
              Urgențe
            </Button>
            <Button 
              onClick={handleShareLocation}
              variant="outline"
              className="h-14 rounded-full border-primary/30 hover:bg-primary/10"
            >
              <Share2 className="w-5 h-5 mr-2 text-primary" />
              Partajează
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveJourney;