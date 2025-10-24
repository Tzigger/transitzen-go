import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Navigation, MapPin, Clock, AlertCircle, Phone, Share2, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import ActiveJourneyMap from "@/components/ActiveJourneyMap";
import { gpsTracker, type GPSPosition } from "@/lib/navigation/gps-tracker";
import { proximityDetector, type ProximityZone, type ProximityAlert } from "@/lib/navigation/proximity-detector";
import { alertManager } from "@/lib/alerts/alert-manager";

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
  const [proximityAlerts, setProximityAlerts] = useState<ProximityAlert[]>([]);
  const [heading, setHeading] = useState<number | undefined>();
  const [speed, setSpeed] = useState<number | undefined>();

  useEffect(() => {
    if (!journeyData) {
      // Try to load from localStorage if no state provided
      const storedJourney = localStorage.getItem('activeJourney');
      if (storedJourney) {
        try {
          const journey = JSON.parse(storedJourney);
          console.log('✅ Restored journey from localStorage:', journey);
          // Re-navigate with the stored data
          navigate('/active-journey', { 
            state: { journey: journey },
            replace: true 
          });
          return;
        } catch (error) {
          console.error('Error parsing stored journey:', error);
          localStorage.removeItem('activeJourney');
        }
      }
      
      console.error('❌ No journey data provided to ActiveJourney');
      toast({
        title: "Eroare",
        description: "Nu există date despre călătorie",
        variant: "destructive",
      });
      navigate('/history');
      return;
    }

    // Save journey to localStorage
    const journeyToSave = {
      ...journeyData.journey,
      startedAt: Date.now(),
      progress: 0,
    };
    localStorage.setItem('activeJourney', JSON.stringify(journeyToSave));

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
      const defaultSegment: JourneyStep = {
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

    // Initialize proximity zones from segments
    initializeProximityZones(segments);

    // Start GPS tracking with new tracker
    startTracking();

    return () => {
      stopTracking();
    };
  }, []);

  /**
   * Initialize proximity zones from journey segments
   */
  const initializeProximityZones = (segments: any[]) => {
    proximityDetector.clearZones();

    segments.forEach((segment, index) => {
      // Add departure stop as proximity zone
      if (segment.type === 'TRANSIT' && segment.startLocation) {
        const zone: ProximityZone = {
          id: `stop-${index}-departure`,
          center: {
            lat: segment.startLocation.lat,
            lng: segment.startLocation.lng,
          },
          radius: 100, // 100m radius
          type: 'stop',
          name: segment.from || `Oprirea ${index + 1}`,
          metadata: { segment, index },
        };
        proximityDetector.addZone(zone);
      }

      // Add arrival stop as proximity zone
      if (segment.type === 'TRANSIT' && segment.endLocation) {
        const zone: ProximityZone = {
          id: `stop-${index}-arrival`,
          center: {
            lat: segment.endLocation.lat,
            lng: segment.endLocation.lng,
          },
          radius: 100, // 100m radius
          type: 'stop',
          name: segment.to || `Oprirea ${index + 2}`,
          metadata: { segment, index },
        };
        proximityDetector.addZone(zone);
      }
    });

    // Add final destination
    if (journeyData?.journey?.destination_lat && journeyData?.journey?.destination_lng) {
      const destinationZone: ProximityZone = {
        id: 'final-destination',
        center: {
          lat: journeyData.journey.destination_lat,
          lng: journeyData.journey.destination_lng,
        },
        radius: 50, // 50m radius
        type: 'destination',
        name: journeyData.journey.destination,
        metadata: {},
      };
      proximityDetector.addZone(destinationZone);
    }

    console.log('🎯 Initialized proximity zones:', proximityDetector.getAllZones().length);
  };

  const startTracking = () => {
    // Set up proximity alert callback
    proximityDetector.onProximity((alert) => {
      console.log('🔔 Proximity alert received:', alert);
      setProximityAlerts((prev) => [...prev, alert]);
      
      // Process alert through alert manager
      alertManager.processAlert(alert);

      // Show visual alert for stop arrivals
      if (alert.alertLevel === 'near' || alert.alertLevel === 'arrived') {
        setShowStopAlert(true);
        setNextStop(alert.zone.name);
      }
    });

    // Start GPS tracking
    gpsTracker.start(
      (position: GPSPosition) => {
        setCurrentLocation({ lat: position.lat, lng: position.lng });
        setHeading(position.heading);
        setSpeed(position.speed);
        
        // Check proximity to zones
        proximityDetector.checkPosition(position.lat, position.lng);
      },
      (error) => {
        console.error('GPS tracking error:', error);
        
        // În development, nu arăta erori GPS (folosește mock location)
        if (import.meta.env.DEV || window.location.hostname === 'localhost') {
          console.warn('🗺️ GPS error ignored in development - using mock location');
          return;
        }
        
        // În production, arată eroare utilizatorului
        let errorMessage = "Nu am putut urmări locația ta";
        if (error.code === 1) {
          errorMessage = "Permite accesul la locație în setările browser-ului";
        } else if (error.code === 2) {
          errorMessage = "Serviciile de localizare sunt indisponibile";
        } else if (error.code === 3) {
          errorMessage = "Timeout la obținerea locației";
        }
        
        toast({
          title: "Eroare GPS",
          description: errorMessage,
          variant: "destructive",
        });
      }
    );

    console.log('🗺️ GPS tracking started');
  };

  const stopTracking = () => {
    gpsTracker.stop();
    proximityDetector.clearZones();
    console.log('🗺️ GPS tracking stopped');
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
      localStorage.removeItem('activeJourney');
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
    
    // Update localStorage with new progress
    const storedJourney = localStorage.getItem('activeJourney');
    if (storedJourney) {
      try {
        const journey = JSON.parse(storedJourney);
        journey.progress = newProgress;
        localStorage.setItem('activeJourney', JSON.stringify(journey));
      } catch (error) {
        console.error('Error updating journey progress:', error);
      }
    }
  };

  const handleEndJourney = () => {
    stopTracking();
    alertManager.clearAllAlerts();
    // Clear active journey from localStorage
    localStorage.removeItem('activeJourney');
    toast({
      title: "Călătorie oprită",
      description: "Tracking-ul a fost oprit",
    });
    navigate('/history');
  };

  const handleDismissAlert = () => {
    setShowStopAlert(false);
    // Clear recent proximity alerts
    setProximityAlerts([]);
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
            heading={heading}
            speed={speed}
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

          {/* Real-time Navigation Status */}
          {currentLocation && (
            <Card className="glass-card p-4 rounded-[2rem] border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <p className="text-sm font-semibold text-foreground">Navigare activă</p>
                </div>
                {heading !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Navigation className="w-3 h-3" style={{ transform: `rotate(${heading}deg)` }} />
                    <span>{Math.round(heading)}°</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Acuratețe</p>
                  <p className="text-sm font-bold text-foreground">
                    {currentLocation ? '< 50m' : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Viteză</p>
                  <p className="text-sm font-bold text-foreground">
                    {speed ? `${(speed * 3.6).toFixed(0)} km/h` : '0 km/h'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Zone Active</p>
                  <p className="text-sm font-bold text-foreground">
                    {proximityDetector.getAllZones().length}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Stop Alert */}
          {showStopAlert && (
            <Card className="glass-card p-4 rounded-[2rem] border-2 border-warning bg-warning/10 animate-pulse">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-warning flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-foreground">Coboară în curând!</p>
                  <p className="text-sm text-muted-foreground">Următoarea oprire: {nextStop}</p>
                  {proximityAlerts.length > 0 && proximityAlerts[proximityAlerts.length - 1] && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Distanță: {Math.round(proximityAlerts[proximityAlerts.length - 1].distance)}m
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    onClick={completeCurrentStep}
                    className="bg-warning hover:bg-warning/90 text-background rounded-full"
                  >
                    Am coborât
                  </Button>
                  <Button 
                    size="sm"
                    variant="ghost"
                    onClick={handleDismissAlert}
                    className="text-xs"
                  >
                    Închide
                  </Button>
                </div>
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