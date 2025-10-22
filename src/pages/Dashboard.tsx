import { Clock, MapPin, Star, TrendingUp, Bus, Bell } from "lucide-react";
import Navigation from "@/components/Navigation";

const Dashboard = () => {
  const savedRoutes = [
    { name: "Home → Work", bus: "28", time: "08:15", favorite: true },
    { name: "Work → Gym", bus: "41", time: "17:30", favorite: false },
    { name: "City Center", bus: "3, 13", time: "Variable", favorite: true },
  ];

  const upcomingDepartures = [
    { bus: "28", destination: "Copou", time: "3 min", occupancy: 45 },
    { bus: "41", destination: "Podu Roș", time: "7 min", occupancy: 72 },
    { bus: "13", destination: "Tătărași", time: "12 min", occupancy: 28 },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-8 md:pl-64">
      <Navigation />
      
      <main className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <header className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                Welcome back! 👋
              </h1>
              <p className="text-muted-foreground">
                Your smart transport dashboard
              </p>
            </div>
            <div className="glass-subtle rounded-full p-4 hover:glass transition-all cursor-pointer">
              <Bell className="w-6 h-6 text-primary" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Saved Routes */}
          <section className="glass-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Star className="w-5 h-5 text-warning" />
                Saved Routes
              </h2>
              <button className="glass-subtle rounded-xl px-4 py-2 text-sm font-medium hover:glass transition-all">
                + New
              </button>
            </div>

            <div className="space-y-3">
              {savedRoutes.map((route, index) => (
                <div key={index} className="glass-subtle rounded-2xl p-4 hover:glass transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-accent" />
                      <span className="font-semibold">{route.name}</span>
                    </div>
                    {route.favorite && (
                      <Star className="w-4 h-4 fill-warning text-warning" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Bus {route.bus}</span>
                    <span>{route.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Departures */}
          <section className="glass-card space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Upcoming Departures
            </h2>

            <div className="space-y-3">
              {upcomingDepartures.map((departure, index) => (
                <div key={index} className="glass rounded-2xl p-4 hover:glass-strong transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="glass-subtle rounded-full p-2">
                        <Bus className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold">Bus {departure.bus}</p>
                        <p className="text-sm text-muted-foreground">
                          to {departure.destination}
                        </p>
                      </div>
                    </div>
                    <div className="glass-subtle rounded-full px-4 py-2">
                      <span className="text-sm font-bold text-primary">
                        {departure.time}
                      </span>
                    </div>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Occupancy</span>
                      <span>{departure.occupancy}%</span>
                    </div>
                    <div className="glass-subtle rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          departure.occupancy > 70
                            ? "bg-danger"
                            : departure.occupancy > 40
                            ? "bg-warning"
                            : "bg-success"
                        }`}
                        style={{ width: `${departure.occupancy}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Smart Alert Preview */}
        <section className="glass rounded-2xl p-6 animate-glass-pulse">
          <div className="flex items-center gap-4">
            <div className="glass-subtle rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">
                Smart Alert Active
              </h3>
              <p className="text-sm text-muted-foreground">
                We'll notify you when to leave for your 17:30 bus
              </p>
            </div>
            <button className="glass-subtle rounded-xl px-6 py-3 font-medium hover:glass transition-all">
              Configure
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
