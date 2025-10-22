import { Home, MapPin, Route, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const Navigation = () => {
  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: MapPin, label: "Map", path: "/map" },
    { icon: Route, label: "Routes", path: "/routes" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="glass-strong rounded-t-3xl px-4 py-3 border-t">
          <div className="flex justify-around items-center">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                    isActive
                      ? "glass-subtle text-primary shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:glass-subtle"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:block fixed left-0 top-0 h-screen w-64 p-4">
        <div className="glass-card h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8 p-4">
            <div className="glass-subtle rounded-full p-3">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">TransitIQ</h1>
              <p className="text-xs text-muted-foreground">Iași Transport</p>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "glass-strong text-primary font-semibold shadow-lg"
                      : "glass-subtle hover:glass text-foreground"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="mt-auto glass-subtle rounded-xl p-4">
            <p className="text-xs text-muted-foreground text-center">
              v1.0.0 • Built with ❤️
            </p>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
