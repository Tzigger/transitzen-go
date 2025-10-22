import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
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
import MobileOnly from "./components/MobileOnly";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MobileOnly><Welcome /></MobileOnly>} />
            <Route path="/login" element={<MobileOnly><Login /></MobileOnly>} />
            <Route path="/signup" element={<MobileOnly><Signup /></MobileOnly>} />
            <Route path="/dashboard" element={<MobileOnly><Dashboard /></MobileOnly>} />
            <Route path="/create-journey" element={<MobileOnly><CreateJourney /></MobileOnly>} />
            <Route path="/map" element={<MobileOnly><MapView /></MobileOnly>} />
            <Route path="/journeys" element={<MobileOnly><Journeys /></MobileOnly>} />
            <Route path="/history" element={<MobileOnly><History /></MobileOnly>} />
            <Route path="/profile" element={<MobileOnly><Profile /></MobileOnly>} />
            <Route path="*" element={<MobileOnly><NotFound /></MobileOnly>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
