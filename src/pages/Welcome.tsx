import { Button } from "@/components/ui/button";
import { MapPin, Clock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl glass-strong mb-4 animate-glow">
            <Zap className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-foreground text-glow">
            ZeroWait
          </h1>
          <p className="text-xl text-muted-foreground px-4">
            We buy you time by giving you the fastest way to get somewhere
          </p>
        </div>

        {/* Feature highlights */}
        <div className="space-y-4">
          <div className="glass p-4 rounded-2xl flex items-start gap-3 hover-lift">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Perfect Timing</h3>
              <p className="text-sm text-muted-foreground">Know exactly when to leave, never wait more than 1 minute</p>
            </div>
          </div>

          <div className="glass p-4 rounded-2xl flex items-start gap-3 hover-lift">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Smart Routes</h3>
              <p className="text-sm text-muted-foreground">AI-powered journey planning with real-time updates</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-4">
          <Button 
            onClick={() => navigate('/signup')}
            className="w-full h-16 text-lg font-semibold gradient-primary hover:opacity-90 transition-all shadow-2xl rounded-full hover:scale-[1.02]"
          >
            Get Started
          </Button>
          <Button 
            onClick={() => navigate('/login')}
            variant="outline"
            className="w-full h-16 text-lg glass-card hover:glass-strong transition-all rounded-full border-white/20"
          >
            Sign In
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Serving Iași, Romania • Never be late again
        </p>
      </div>
    </div>
  );
};

export default Welcome;
