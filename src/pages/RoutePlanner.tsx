import { MapPin, Navigation as NavigationIcon, Clock, TrendingUp, Bus } from "lucide-react";
import AppNavigation from "@/components/Navigation";

const RoutePlanner = () => {
  const routeResults = [
    {
      type: "Fastest",
      duration: "18 min",
      buses: ["28", "41"],
      transfers: 1,
      walking: "5 min",
      departure: "14:23",
      occupancy: 45,
      badge: "Recommended",
    },
    {
      type: "Least Walking",
      duration: "22 min",
      buses: ["13"],
      transfers: 0,
      walking: "2 min",
      departure: "14:27",
      occupancy: 72,
    },
    {
      type: "Least Crowded",
      duration: "20 min",
      buses: ["3", "28"],
      transfers: 1,
      walking: "6 min",
      departure: "14:25",
      occupancy: 28,
      badge: "Comfortable",
    },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-8 md:pl-64">
      <AppNavigation />

      <main className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <header className="neu-card">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Plan Your Route</h1>
          
          {/* Location Inputs */}
          <div className="space-y-3">
            <div className="neu-pressed rounded-xl p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <input
                  type="text"
                  placeholder="From: Current Location"
                  className="flex-1 bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="neu-pressed rounded-xl p-4">
              <div className="flex items-center gap-3">
                <NavigationIcon className="w-5 h-5 text-accent" />
                <input
                  type="text"
                  placeholder="To: Enter destination"
                  className="flex-1 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Time Selector */}
            <div className="flex gap-3">
              <div className="neu-pressed rounded-xl p-4 flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Leave now</span>
                </div>
              </div>
              <button className="neu-flat rounded-xl px-6 font-semibold hover:neu-pressed transition-all">
                Find Routes
              </button>
            </div>
          </div>
        </header>

        {/* Results */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold px-2">Available Routes</h2>
          
          {routeResults.map((route, index) => (
            <div
              key={index}
              className="neu-card hover:neu-float cursor-pointer group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{route.type}</h3>
                    {route.badge && (
                      <span className="neu-pressed rounded-full px-3 py-1 text-xs font-medium text-primary">
                        {route.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-primary">{route.duration}</p>
                </div>
                <div className="neu-pressed rounded-xl px-4 py-2">
                  <p className="text-sm font-mono font-bold">{route.departure}</p>
                </div>
              </div>

              {/* Route Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="neu-pressed rounded-xl p-3 text-center">
                  <Bus className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <p className="text-xs text-muted-foreground mb-1">Buses</p>
                  <p className="font-semibold">{route.buses.join(", ")}</p>
                </div>

                <div className="neu-pressed rounded-xl p-3 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground mb-1">Transfers</p>
                  <p className="font-semibold">{route.transfers}</p>
                </div>

                <div className="neu-pressed rounded-xl p-3 text-center">
                  <MapPin className="w-5 h-5 mx-auto mb-1 text-warning" />
                  <p className="text-xs text-muted-foreground mb-1">Walking</p>
                  <p className="font-semibold">{route.walking}</p>
                </div>

                <div className="neu-pressed rounded-xl p-3 text-center">
                  <div className="w-5 h-5 mx-auto mb-1 rounded-full" 
                    style={{
                      background: route.occupancy > 70 
                        ? "#ef4444" 
                        : route.occupancy > 40 
                        ? "#f59e0b" 
                        : "#10b981"
                    }}
                  />
                  <p className="text-xs text-muted-foreground mb-1">Crowding</p>
                  <p className="font-semibold">{route.occupancy}%</p>
                </div>
              </div>

              {/* Occupancy Bar */}
              <div className="neu-pressed rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    route.occupancy > 70
                      ? "bg-danger"
                      : route.occupancy > 40
                      ? "bg-warning"
                      : "bg-success"
                  }`}
                  style={{ width: `${route.occupancy}%` }}
                />
              </div>

              {/* Action Button */}
              <button className="mt-4 w-full neu-flat rounded-xl py-3 font-semibold group-hover:neu-pressed transition-all">
                View Details
              </button>
            </div>
          ))}
        </section>

        {/* Smart Tips */}
        <section className="neu-float rounded-2xl p-6">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Smart Tip
          </h3>
          <p className="text-muted-foreground">
            Taking the 14:23 route will get you there on time with minimal wait. 
            We'll notify you when to leave.
          </p>
        </section>
      </main>
    </div>
  );
};

export default RoutePlanner;
