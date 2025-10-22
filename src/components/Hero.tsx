import { Clock, TrendingUp, Bell, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-6 animate-slide-up">
          <div className="glass-subtle rounded-2xl px-4 py-2 inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">AI-Powered Transport</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Never Be
            <span className="block gradient-text">Late Again</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground">
            We buy you time by giving you the fastest way to get somewhere. 
            Smart notifications ensure you arrive precisely on time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              size="lg"
              className="glass-button bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl hover:scale-105"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="glass border-0"
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8">
            {[
              { value: "50+", label: "Routes" },
              { value: "200+", label: "Stops" },
              { value: "5min", label: "Avg. Wait" },
            ].map((stat, index) => (
              <div 
                key={index}
                className="glass-subtle rounded-xl p-4 text-center hover:glass transition-all"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Visual */}
        <div className="relative">
          <div className="glass-card rounded-3xl p-8 animate-float">
            <div className="space-y-4">
              {/* Mock Bus Card */}
              <div className="glass-subtle rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="glass rounded-full p-3">
                      <Clock className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">Bus 28</p>
                      <p className="text-sm text-muted-foreground">to Copou</p>
                    </div>
                  </div>
                  <div className="glass-subtle rounded-full px-4 py-2">
                    <span className="text-sm font-mono font-bold">3 min</span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="glass-subtle rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent animate-pulse"
                    style={{ width: "75%" }}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span>On time • Low crowding</span>
                </div>
              </div>

              {/* Notification Card */}
              <div className="glass rounded-2xl p-4 flex items-center gap-3 animate-glass-pulse">
                <div className="glass-subtle rounded-full p-2">
                  <Bell className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Leave in 5 minutes</p>
                  <p className="text-xs text-muted-foreground">Perfect timing to catch your bus</p>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute -top-4 -right-4 glass rounded-full p-4 animate-float" style={{ animationDelay: "0.5s" }}>
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <div className="absolute -bottom-4 -left-4 glass rounded-full p-4 animate-float" style={{ animationDelay: "1s" }}>
            <TrendingUp className="w-6 h-6 text-success" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
