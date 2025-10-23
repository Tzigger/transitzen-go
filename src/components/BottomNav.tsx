import { Home, Map, Clock, User, List } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { memo } from "react";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Map, label: 'Map', path: '/map' },
    { icon: List, label: 'Journeys', path: '/journeys' },
    { icon: Clock, label: 'History', path: '/history' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 glass-card backdrop-blur-2xl z-50 rounded-[2rem] shadow-2xl mx-auto max-w-md">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={`h-auto p-4 rounded-2xl transition-all ${
                active ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              }`}
            >
              <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
                <Icon className="w-6 h-6" />
                {active && (
                  <div className="absolute inset-0 bg-primary/30 blur-md rounded-full" />
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

export default memo(BottomNav);
