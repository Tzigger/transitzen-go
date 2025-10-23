import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Capacitor } from "@capacitor/core";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateJourney from "./pages/CreateJourney";
import MapView from "./pages/MapView";
import Journeys from "./pages/Journeys";
import History from "./pages/History";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ActiveJourney from "./pages/ActiveJourney";
import MobileOnly from "./components/MobileOnly";

const queryClient = new QueryClient();

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
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
        </Router>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
