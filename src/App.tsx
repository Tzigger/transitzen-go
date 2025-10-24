import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Capacitor } from "@capacitor/core";
import { lazy, Suspense } from "react";
import MobileOnly from "./components/MobileOnly";
import { ConvexClientProvider } from "./lib/convex";
import { AuthValidator } from "./components/AuthValidator";

// Lazy load all pages for better performance
const Welcome = lazy(() => import("./pages/Welcome"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateJourney = lazy(() => import("./pages/CreateJourney"));
const MapView = lazy(() => import("./pages/MapView"));
const Journeys = lazy(() => import("./pages/Journeys"));
const History = lazy(() => import("./pages/History"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ActiveJourney = lazy(() => import("./pages/ActiveJourney"));

const queryClient = new QueryClient();

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

// Loading component for lazy routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      <p className="text-sm text-muted-foreground">Se încarcă...</p>
    </div>
  </div>
);

const App = () => (
  <ConvexClientProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AuthValidator />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<MobileOnly><Welcome /></MobileOnly>} />
                <Route path="/login" element={<MobileOnly><Login /></MobileOnly>} />
                <Route path="/signup" element={<MobileOnly><Signup /></MobileOnly>} />
                <Route path="/dashboard" element={<MobileOnly><Dashboard /></MobileOnly>} />
                <Route path="/create-journey" element={<MobileOnly><CreateJourney /></MobileOnly>} />
                <Route path="/map" element={<MobileOnly><MapView /></MobileOnly>} />
                <Route path="/journeys" element={<MobileOnly><Journeys /></MobileOnly>} />
                <Route path="/history" element={<MobileOnly><History /></MobileOnly>} />
                <Route path="/active-journey" element={<MobileOnly><ActiveJourney /></MobileOnly>} />
                <Route path="/profile" element={<MobileOnly><Profile /></MobileOnly>} />
                <Route path="*" element={<MobileOnly><NotFound /></MobileOnly>} />
              </Routes>
            </Suspense>
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ConvexClientProvider>
);

export default App;
