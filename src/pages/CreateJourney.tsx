import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, MapPin, Clock, Bell, Save, Navigation, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import RouteDisplay from "@/components/RouteDisplay";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/lib/convex";
import { notificationService } from "@/lib/notifications/notification-service";

const USER_LOCATION = { lat: 47.1585, lng: 27.6014 };

const CreateJourney = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { userId } = useAuth();
  
  // Convex mutations and actions
  const createJourneyMutation = useMutation(api.journeys.createJourney);
  const createFavoriteRouteMutation = useMutation(api.favoriteRoutes.createFavoriteRoute);
  const searchPlacesAction = useAction(api.actions.searchPlaces);
  const calculateTransitRouteAction = useAction(api.actions.calculateTransitRoute);
  
  // Get prefilled data from navigation state
  const prefilledData = location.state as {
    prefilledOrigin?: string;
    prefilledOriginCoords?: { lat: number; lng: number };
    prefilledDestination?: string;
    prefilledDestinationCoords?: { lat: number; lng: number };
    calculatedRoutes?: any[]; // Rute pre-calculate din MapView
  } | null;
  
  const [origin, setOrigin] = useState(prefilledData?.prefilledOrigin || "");
  const [originCoords, setOriginCoords] = useState(prefilledData?.prefilledOriginCoords || USER_LOCATION);
  // Dacă origin este "Locația curentă" sau nu există prefilledOrigin, activează toggle-ul
  const [useCurrentLocation, setUseCurrentLocation] = useState(
    !prefilledData?.prefilledOrigin || prefilledData?.prefilledOrigin === "Locația curentă"
  );
  const [currentLocationName, setCurrentLocationName] = useState<string>("Detectare locație...");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [destination, setDestination] = useState(prefilledData?.prefilledDestination || "");
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(
    prefilledData?.prefilledDestinationCoords || null
  );
  const [searchQuery, setSearchQuery] = useState(prefilledData?.prefilledDestination || "");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [originSearchQuery, setOriginSearchQuery] = useState("");
  const [originSearchResults, setOriginSearchResults] = useState<any[]>([]);
  const [showOriginResults, setShowOriginResults] = useState(false);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  
  // Initialize date and time with defaults when coming from MapView
  const getDefaultDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // O oră în viitor implicit
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0, 5); // HH:MM
    return { dateStr, timeStr };
  };
  
  const defaults = getDefaultDateTime();
  const [arrivalTime, setArrivalTime] = useState(prefilledData?.calculatedRoutes ? defaults.timeStr : "");
  const [date, setDate] = useState(prefilledData?.calculatedRoutes ? defaults.dateStr : "");
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [notifyDeparture, setNotifyDeparture] = useState(true);
  const [notifyDelays, setNotifyDelays] = useState(true);
  const [notifyCrowding, setNotifyCrowding] = useState(false);
  const [notifyRouteChanges, setNotifyRouteChanges] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [showSaveFavoriteDialog, setShowSaveFavoriteDialog] = useState(false);
  const [favoriteName, setFavoriteName] = useState("");
  
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

  // Get user's current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      // În development, folosește locație mock
      if (import.meta.env.DEV || window.location.hostname === 'localhost') {
        console.warn('🗺️ Geolocation not supported - using mock location');
        setOriginCoords(USER_LOCATION);
        setCurrentLocationName("TehnoPolIS, Iași (Mock)");
        setIsLoadingLocation(false);
        return;
      }
      
      toast({
        title: "Eroare",
        description: "Browser-ul tău nu suportă geolocalizare",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingLocation(true);
    setCurrentLocationName("Detectare locație...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        setOriginCoords(coords);
        
        // Reverse geocode to get location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=16&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.address) {
            const locationParts = [];
            if (data.address.road) locationParts.push(data.address.road);
            if (data.address.city || data.address.town || data.address.village) {
              locationParts.push(data.address.city || data.address.town || data.address.village);
            }
            setCurrentLocationName(locationParts.join(", ") || "Locația curentă");
          } else {
            setCurrentLocationName("Locația curentă");
          }
        } catch (error) {
          setCurrentLocationName("Locația curentă");
        }
        
        setIsLoadingLocation(false);
        
        toast({
          title: "Locație detectată ✓",
          description: "Am găsit locația ta curentă",
        });
      },
      (error) => {
        setIsLoadingLocation(false);
        
        // În development, folosește locație mock în loc de eroare
        if (import.meta.env.DEV || window.location.hostname === 'localhost') {
          console.warn('🗺️ GPS error in development - using mock location');
          setOriginCoords(USER_LOCATION);
          setCurrentLocationName("TehnoPolIS, Iași (Mock)");
          toast({
            title: "⚠️ Mod Development",
            description: "Folosim o locație mock pentru testare",
          });
          return;
        }
        
        setCurrentLocationName("Nu s-a putut detecta");
        
        let errorMessage = "Nu am putut accesa locația ta";
        
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Permite accesul la locație în setările browser-ului";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Locația nu este disponibilă momentan";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Detectarea locației a expirat";
        }
        
        toast({
          title: "Eroare geolocalizare",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Get location when toggle is enabled
  useEffect(() => {
    if (useCurrentLocation) {
      // Întotdeauna apelăm getCurrentLocation când toggle-ul e activat
      // indiferent dacă avem sau nu prefilledOrigin
      getCurrentLocation();
    }
  }, [useCurrentLocation]);

<<<<<<< Updated upstream
  // Folosește rutele pre-calculate dacă există
  useEffect(() => {
    if (prefilledData?.calculatedRoutes && prefilledData.calculatedRoutes.length > 0) {
      console.log('📍 Using pre-calculated routes from MapView:', prefilledData.calculatedRoutes);
      
      // Calculăm timpul de sosire dorit
      let targetArrivalTime: Date | undefined;
      if (arrivalTime && date) {
        targetArrivalTime = new Date(`${date}T${arrivalTime}`);
      }
      
      // Transform routes to RouteDisplay format
      const transformedRoutes = transformGoogleRoutesToDisplay(prefilledData.calculatedRoutes, targetArrivalTime);
      setRoutes(transformedRoutes);
      setSelectedRoute(transformedRoutes[0]); // Selectează prima rută (cea mai rapidă)
      
      // Arată toast cu info că poate recalcula pentru alte ore
      if (arrivalTime && date) {
        toast({
          title: "💡 Sfat",
          description: "Modifică ora sau data și apasă 'Recalculează' pentru rute actualizate",
          duration: 5000,
        });
      }
    }
  }, [prefilledData?.calculatedRoutes]); // Doar la mount, nu la schimbarea orei

  // Helper function to transform Google routes to RouteDisplay format
  const transformGoogleRoutesToDisplay = (googleRoutes: any[], targetArrivalTime?: Date) => {
    return googleRoutes.map((route: any) => {
      const segments = route.legs.map((leg: any) => {
        if (leg.mode === 'TRANSIT') {
          return {
            mode: 'TRANSIT',
            vehicle: {
              type: leg.vehicleType || 'BUS',
              line: leg.routeShortName || '?',
              name: leg.routeName || '',
            },
            from: leg.startLocation?.name || leg.from || 'Stație necunoscută',
            to: leg.endLocation?.name || leg.to || 'Stație necunoscută',
            duration: leg.duration || 'N/A',
            stops: leg.numStops || 0,
            distance: leg.distance || 'N/A',
            crowdingLevel: route.estimatedCrowding || 'medium',
          };
        } else {
          return {
            mode: 'WALK',
            from: '',
            to: '',
            duration: leg.duration || 'N/A',
            distance: leg.distance || 'N/A',
          };
        }
      });

      // Folosește timpii reali de la Google dacă există
      let departureTime: string;
      let arrivalTimeStr: string;
      
      if (route.departureTime && route.arrivalTime) {
        // Google a returnat timpi reali (format: "1:07 AM" sau "13:07")
        departureTime = route.departureTime;
        arrivalTimeStr = route.arrivalTime;
      } else {
        // Fallback: calculează bazat pe targetArrivalTime sau timpul curent
        let arrivalDate: Date;
        let departureDate: Date;
        
        if (targetArrivalTime) {
          arrivalDate = targetArrivalTime;
          departureDate = new Date(arrivalDate.getTime() - (route.durationValue * 1000));
        } else {
          departureDate = new Date();
          arrivalDate = new Date(departureDate.getTime() + (route.durationValue * 1000));
        }

        departureTime = departureDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
        arrivalTimeStr = arrivalDate.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
      }

      return {
        totalDuration: Math.round(route.durationValue / 60), // convertește din secunde în minute
        totalDistance: route.distance || 'N/A',
        segments: segments,
        departureTime: departureTime,
        arrivalTime: arrivalTimeStr,
        transferCount: route.transferCount || 0,
        estimatedCrowding: route.estimatedCrowding || 'medium',
        warnings: route.warnings || [],
      };
    });
  };
=======
  // Request notification permission on mount
  useEffect(() => {
    const requestNotificationPermission = async () => {
      const hasPermission = await notificationService.checkPermission();
      if (!hasPermission) {
        const granted = await notificationService.requestPermission();
        if (granted) {
          toast({
            title: "Notificări activate ✓",
            description: "Vei primi alerte pentru călătoriile tale",
          });
        }
      }
    };
    requestNotificationPermission();
  }, []);
>>>>>>> Stashed changes

  const handleOriginSearch = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setOriginSearchResults([]);
      setShowOriginResults(false);
      return;
    }

    setIsSearchingOrigin(true);
    setShowOriginResults(true);
    
    try {
      const data = await searchPlacesAction({
        query,
        location: USER_LOCATION,
      });

      setOriginSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching places:', error);
      setOriginSearchResults([]);
    } finally {
      setIsSearchingOrigin(false);
    }
  };

  const handleSelectOriginPlace = (place: any) => {
    setOriginSearchQuery(place.name);
    setOrigin(place.address);
    setOriginCoords(place.location);
    setShowOriginResults(false);
    setOriginSearchResults([]);
    
    // Auto-calculate route if we have both origin and destination
    if (destination && destinationCoords && date && arrivalTime) {
      calculateRoute();
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    
    try {
      const data = await searchPlacesAction({
        query,
        location: USER_LOCATION,
      });

      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place: any) => {
    setSearchQuery(place.name);
    setDestination(place.address);
    setDestinationCoords(place.location);
    setShowResults(false);
    setSearchResults([]);
    
    // Auto-calculate route if we have both origin and destination
    if ((useCurrentLocation || origin) && date && arrivalTime) {
      calculateRoute(place.location);
    }
  };

  const calculateRoute = async (destCoords?: { lat: number; lng: number }) => {
    const targetCoords = destCoords || destinationCoords;
    
    if (!targetCoords) {
      return;
    }

    setIsCalculatingRoute(true);
    
    try {
      // Convert arrival time to timestamp if provided
      let arrivalTimestamp;
      if (arrivalTime && date) {
        const arrivalDateTime = new Date(`${date}T${arrivalTime}`);
        arrivalTimestamp = Math.floor(arrivalDateTime.getTime() / 1000);
      }

      const data = await calculateTransitRouteAction({
        origin: originCoords,
        destination: targetCoords,
        arrivalTime: arrivalTimestamp,
      });

      if (data.error) {
        console.error('Route calculation error:', data.error);
        toast({
          title: "Eroare la calculare",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      if (data.routes && data.routes.length > 0) {
        // Calculăm timpul de sosire dorit
        let targetArrivalTime: Date | undefined;
        if (arrivalTime && date) {
          targetArrivalTime = new Date(`${date}T${arrivalTime}`);
        }
        
        const transformedRoutes = transformGoogleRoutesToDisplay(data.routes, targetArrivalTime);
        setRoutes(transformedRoutes);
        setSelectedRoute(transformedRoutes[0]); // Auto-select first route
        
        toast({
          title: "Rute găsite! 🎉",
          description: `Am găsit ${data.routes.length} ${data.routes.length === 1 ? 'rută' : 'rute'} pentru tine`,
        });
      } else {
        toast({
          title: "Nu am găsit rute",
          description: "Încearcă să modifici locația sau ora",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut calcula ruta. Te rog încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const toggleRecurringDay = (dayIndex: number) => {
    setRecurringDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleSelectRoute = (route: any) => {
    setSelectedRoute(route);
  };

  const handleConfirmRoute = () => {
    // Scroll to notifications section
    setTimeout(() => {
      notificationsRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
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

    if (!selectedRoute) {
      toast({
        title: "Eroare",
        description: "Te rog selectează o rută",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Eroare",
        description: "Trebuie să fii autentificat",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsSaving(true);

    try {
      // Calculate departure time from selected route
      const departureParts = selectedRoute.departureTime.match(/(\d+):(\d+)/);
      const departureTime = departureParts ? `${departureParts[1]}:${departureParts[2]}` : null;

      const journeyId = await createJourneyMutation({
        userId,
        origin: useCurrentLocation ? "Locația curentă" : origin,
        originLat: originCoords.lat,
        originLng: originCoords.lng,
        destination: destination.trim(),
        destinationLat: destinationCoords?.lat,
        destinationLng: destinationCoords?.lng,
        arrivalDate: date,
        arrivalTime: arrivalTime,
        departureTime: departureTime || undefined,
        estimatedDuration: selectedRoute.totalDuration,
        routeDetails: {
          segments: selectedRoute.segments,
          totalDistance: selectedRoute.totalDistance,
        },
        recurringDays: recurringDays.length > 0 ? recurringDays : undefined,
        notifyDeparture,
        notifyDelays,
        notifyCrowding,
        notifyRouteChanges,
      });

      // Schedule notifications if enabled
      if (notifyDeparture && departureTime) {
        try {
          const departureDateTime = new Date(`${date}T${departureTime}`);
          
          // Schedule departure notification (10 minutes before)
          await notificationService.scheduleDepartureNotification(
            journeyId.toString(),
            departureDateTime,
            useCurrentLocation ? "Locația curentă" : origin,
            destination.trim(),
            10 // 10 minutes advance
          );

          // Schedule pre-departure notification (30 minutes before)
          await notificationService.schedulePreDepartureNotification(
            journeyId.toString(),
            departureDateTime,
            destination.trim(),
            30 // 30 minutes advance
          );

          console.log('✅ Notifications scheduled successfully');
        } catch (notifError) {
          console.error('Failed to schedule notifications:', notifError);
          // Don't fail the journey creation if notifications fail
        }
      }

      toast({
        title: "Success! 🎉",
        description: notifyDeparture 
          ? "Călătoria și notificările au fost programate"
          : "Călătoria ta a fost planificată cu succes",
      });

      navigate('/history');
    } catch (error) {
      console.error('Error saving journey:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut salva călătoria. Te rog încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsFavorite = async () => {
    if (!favoriteName.trim()) {
      toast({
        title: "Eroare",
        description: "Te rog introdu un nume pentru traseu",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRoute) {
      toast({
        title: "Eroare",
        description: "Te rog selectează o rută",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Eroare",
        description: "Trebuie să fii autentificat",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!destinationCoords) {
      toast({
        title: "Eroare",
        description: "Nu există coordonate pentru destinație",
        variant: "destructive",
      });
      return;
    }

    try {
      await createFavoriteRouteMutation({
        userId,
        name: favoriteName.trim(),
        origin: useCurrentLocation ? "Locația curentă" : origin,
        originLat: originCoords.lat,
        originLng: originCoords.lng,
        destination: destination.trim(),
        destinationLat: destinationCoords.lat,
        destinationLng: destinationCoords.lng,
        routeInfo: {
          totalDuration: selectedRoute.totalDuration,
          totalDistance: selectedRoute.totalDistance,
          segments: selectedRoute.segments,
        },
      });

      toast({
        title: "Success! ⭐",
        description: "Traseu salvat în favorite",
      });

      setShowSaveFavoriteDialog(false);
      setFavoriteName("");
    } catch (error) {
      console.error('Error saving favorite route:', error);
      toast({
        title: "Eroare",
        description: "Nu am putut salva traseul favorit",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="min-h-screen gradient-dark pb-24 transition-transform safe-area-top"
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
        {/* Origin */}
        <div className="glass-card p-6 rounded-[2rem] space-y-4 shadow-xl relative z-[60]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Navigation className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">De unde pleci?</h2>
          </div>

          <div className="glass p-5 rounded-2xl border border-white/10 flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">Folosește locația curentă</p>
              <div className="flex items-center gap-2">
                {isLoadingLocation && (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                )}
                <p className="text-sm text-muted-foreground">
                  {currentLocationName}
                </p>
              </div>
            </div>
            <Switch 
              checked={useCurrentLocation}
              onCheckedChange={setUseCurrentLocation}
              className="data-[state=checked]:bg-primary" 
            />
          </div>

          {/* Manual origin search when toggle is off */}
          {!useCurrentLocation && (
            <div className="space-y-2 relative">
              <Label htmlFor="origin" className="text-muted-foreground text-sm">De unde pleci?</Label>
              <div className="relative">
                <Input 
                  id="origin"
                  placeholder="Caută adresă de plecare..."
                  value={originSearchQuery}
                  onChange={(e) => {
                    setOriginSearchQuery(e.target.value);
                    handleOriginSearch(e.target.value);
                  }}
                  className="h-14 glass border-white/20 text-foreground placeholder:text-muted-foreground rounded-2xl pr-10"
                />
                {isSearchingOrigin && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Origin Search Results */}
              {showOriginResults && originSearchResults.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 glass-card backdrop-blur-xl rounded-2xl shadow-2xl max-h-80 overflow-y-auto z-[100] bg-background/95 border border-primary/30">
                  {originSearchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectOriginPlace(result)}
                      className="w-full text-left px-4 py-3 hover:bg-primary/20 transition-colors border-b border-white/5 last:border-0 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-lg">📍</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{result.name}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.address}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results for origin */}
              {showOriginResults && originSearchQuery.length >= 3 && originSearchResults.length === 0 && !isSearchingOrigin && (
                <div className="absolute top-full mt-2 left-0 right-0 glass-card backdrop-blur-xl rounded-2xl shadow-2xl z-[100] bg-background/95 border border-primary/30 px-4 py-3">
                  <p className="text-sm text-muted-foreground text-center">Nu s-au găsit rezultate</p>
                </div>
              )}

              {/* Selected origin display */}
              {origin && !useCurrentLocation && (
                <div className="glass p-4 rounded-2xl border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary flex-shrink-0" />
                    <p className="text-sm text-foreground flex-1">{origin}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setOrigin("");
                        setOriginSearchQuery("");
                      }}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Destination */}
        <div className="glass-card p-6 rounded-[2rem] space-y-4 shadow-xl relative z-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Destination</h2>
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="destination" className="text-muted-foreground text-sm">Unde vrei să ajungi?</Label>
            <div className="relative">
              <Input 
                id="destination"
                placeholder="Caută adresă sau loc..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="h-14 glass border-white/20 text-foreground placeholder:text-muted-foreground rounded-2xl pr-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 glass-card backdrop-blur-xl rounded-2xl shadow-2xl max-h-80 overflow-y-auto z-[100] bg-background/95 border border-primary/30">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectPlace(result)}
                    className="w-full text-left px-4 py-3 hover:bg-primary/20 transition-colors border-b border-white/5 last:border-0 first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-lg">📍</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{result.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.address}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results message */}
            {showResults && searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
              <div className="absolute top-full mt-2 left-0 right-0 glass-card backdrop-blur-xl rounded-2xl shadow-2xl z-[100] bg-background/95 border border-primary/30 px-4 py-3">
                <p className="text-sm text-muted-foreground text-center">Nu s-au găsit rezultate</p>
              </div>
            )}

            {/* Selected destination display */}
            {destination && (
              <div className="glass p-4 rounded-2xl border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-sm text-foreground flex-1">{destination}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setDestination("");
                      setSearchQuery("");
                    }}
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
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
              <Label htmlFor="time" className="text-muted-foreground text-sm">Vreau să ajung la ora</Label>
              <Input 
                id="time"
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                step="60"
                lang="ro-RO"
                className="h-16 glass border-white/20 text-foreground text-3xl font-bold rounded-2xl [&::-webkit-calendar-picker-indicator]:invert-[0.8]"
              />
            </div>

            {/* Recalculate Route Button - shows when time/date changed and we have existing routes */}
            {destination && destinationCoords && date && arrivalTime && (
              <Button
                onClick={() => calculateRoute()}
                disabled={isCalculatingRoute}
                className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-semibold"
              >
                {isCalculatingRoute ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Se calculează...
                  </>
                ) : routes.length > 0 ? (
                  <>
                    🔄 Recalculează pentru {arrivalTime}
                  </>
                ) : (
                  <>
                    🚀 Calculează ruta
                  </>
                )}
              </Button>
            )}
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

        {/* Route Options */}
        {routes.length > 0 && (
          <div className="space-y-4">
            {/* Info banner about recalculating */}
            {prefilledData?.calculatedRoutes && (
              <div className="glass-card p-4 rounded-2xl border border-primary/30 bg-primary/5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      Rute calculate pentru plecare imediată
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dacă vrei să pleci la o altă oră, modifică timpul și apasă "Recalculează" pentru rute actualizate cu orarele reale ale autobuzelor.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="glass-card p-6 rounded-[2rem] space-y-4 shadow-xl">
              <RouteDisplay
                routes={routes}
                onSelectRoute={handleSelectRoute}
                onConfirmRoute={handleConfirmRoute}
                selectedRoute={selectedRoute}
              />
            </div>
          </div>
        )}

        {/* Notifications */}
        {selectedRoute && (
          <div ref={notificationsRef} className="glass-card p-6 rounded-[2rem] space-y-4 shadow-xl">
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
        )}

        {/* Save Button */}
        {selectedRoute && (
          <div className="space-y-3">
            <Button
              onClick={handleSaveJourney}
              disabled={isSaving}
              className="w-full h-16 text-lg font-semibold gradient-primary shadow-2xl rounded-full mb-2 hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {isSaving ? 'Se salvează...' : 'Planifică călătoria'}
            </Button>
            
            <Button
              onClick={() => setShowSaveFavoriteDialog(true)}
              variant="outline"
              className="w-full h-14 text-base font-semibold rounded-full border-primary/30 hover:bg-primary/10"
            >
              ⭐ Salvează ca favorit
            </Button>
          </div>
        )}
      </div>

      {/* Bottom fade for nav bar */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-40" />

      <BottomNav />

      {/* Save as Favorite Dialog */}
      <Dialog open={showSaveFavoriteDialog} onOpenChange={setShowSaveFavoriteDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Salvează ca traseu favorit</DialogTitle>
            <DialogDescription>
              Salvează acest traseu pentru a-l accesa rapid mai târziu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="favorite-name">Nume traseu</Label>
              <Input
                id="favorite-name"
                placeholder="ex: Acasă - Serviciu"
                value={favoriteName}
                onChange={(e) => setFavoriteName(e.target.value)}
                className="h-12 glass border-white/20 rounded-2xl"
              />
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-sm text-muted-foreground mb-2">Detalii traseu:</p>
              <p className="text-sm"><strong>De la:</strong> {useCurrentLocation ? "Locația curentă" : origin}</p>
              <p className="text-sm"><strong>Către:</strong> {destination}</p>
            </div>
            <Button
              onClick={handleSaveAsFavorite}
              className="w-full h-12 gradient-primary rounded-full"
            >
              Salvează
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateJourney;
