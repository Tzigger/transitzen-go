import { User, Bell, MapPin, Clock, Settings, LogOut } from "lucide-react";
import Navigation from "@/components/Navigation";

const Profile = () => {
  return (
    <div className="min-h-screen pb-20 md:pb-8 md:pl-64">
      <Navigation />

      <main className="p-4 md:p-8 space-y-6">
        {/* Profile Header */}
        <header className="glass-card text-center">
          <div className="glass-subtle rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <User className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Guest User</h1>
          <p className="text-muted-foreground">Sign in to save your preferences</p>
          <button className="mt-4 glass-button bg-gradient-to-r from-primary to-accent text-white hover:scale-105">
            Sign In
          </button>
        </header>

        {/* Settings Sections */}
        <section className="glass-card space-y-4">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>

          {/* Notification Settings */}
          <div className="glass-subtle rounded-xl p-4 hover:glass transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">Smart Notifications</p>
                  <p className="text-sm text-muted-foreground">Get departure alerts</p>
                </div>
              </div>
              <div className="glass rounded-full w-12 h-6 p-1 cursor-pointer">
                <div className="glass-subtle rounded-full w-4 h-4 ml-auto" />
              </div>
            </div>
          </div>

          {/* Walking Speed */}
          <div className="glass-subtle rounded-xl p-4 hover:glass transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-semibold">Walking Speed</p>
                  <p className="text-sm text-muted-foreground">Average (4.5 km/h)</p>
                </div>
              </div>
            </div>
            <div className="glass-subtle rounded-full h-2">
              <div className="h-full w-1/2 bg-accent rounded-full" />
            </div>
          </div>

          {/* Departure Buffer */}
          <div className="glass-subtle rounded-xl p-4 hover:glass transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-semibold">Departure Buffer</p>
                  <p className="text-sm text-muted-foreground">5 minutes early</p>
                </div>
              </div>
              <button className="glass-subtle rounded-xl px-4 py-2 text-sm hover:glass transition-all">
                Change
              </button>
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <section className="space-y-3">
          <button className="glass rounded-xl p-4 w-full flex items-center gap-3 hover:glass-strong transition-all">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold">App Settings</span>
          </button>

          <button className="glass rounded-xl p-4 w-full flex items-center gap-3 hover:glass-strong transition-all text-danger">
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Sign Out</span>
          </button>
        </section>

        {/* App Info */}
        <div className="glass-subtle rounded-xl p-6 text-center text-sm text-muted-foreground">
          <p>TransitIQ v1.0.0</p>
          <p className="mt-2">Built with ❤️ for Iași</p>
        </div>
      </main>
    </div>
  );
};

export default Profile;
