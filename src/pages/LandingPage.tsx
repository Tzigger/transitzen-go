import { Button } from "@/components/ui/button";
import { Smartphone, Clock, Leaf, TrendingUp, Navigation, Bell, Map } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen gradient-dark overflow-hidden safe-all-fixed">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-2xl">
              <Navigation className="w-10 h-10" />
            </div>
            <h1 className="text-5xl font-bold text-foreground">TransitFlow</h1>
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Călătorește inteligent prin oraș
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Ajunge la timp oriunde, cu planificare automată și notificări în timp real pentru transportul public.
          </p>

          {/* Mobile Preview Mock */}
          <div className="relative mb-16">
            <div className="w-80 h-[600px] mx-auto glass-card rounded-[3rem] p-4 shadow-2xl border-4 border-white/10">
              <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative">
                {/* Mock app screenshot */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background">
                  {/* Header */}
                  <div className="p-4">
                    <div className="glass-card rounded-[2rem] p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-primary"></div>
                        <div className="flex-1">
                          <div className="h-3 w-24 bg-foreground/20 rounded mb-2"></div>
                          <div className="h-2 w-16 bg-muted-foreground/20 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="px-4 grid grid-cols-2 gap-2 mb-4">
                    <div className="glass-card p-3 rounded-2xl text-center">
                      <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="h-4 w-12 bg-foreground/20 rounded mx-auto mb-1"></div>
                      <div className="h-2 w-16 bg-muted-foreground/20 rounded mx-auto"></div>
                    </div>
                    <div className="glass-card p-3 rounded-2xl text-center">
                      <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
                      <div className="h-4 w-12 bg-foreground/20 rounded mx-auto mb-1"></div>
                      <div className="h-2 w-16 bg-muted-foreground/20 rounded mx-auto"></div>
                    </div>
                  </div>

                  {/* Journey Card Mock */}
                  <div className="px-4">
                    <div className="glass-card p-4 rounded-2xl mb-2">
                      <div className="h-4 w-32 bg-foreground/20 rounded mb-3"></div>
                      <div className="flex gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm">🚍</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm">🚊</span>
                        </div>
                      </div>
                      <div className="h-3 w-24 bg-muted-foreground/20 rounded"></div>
                    </div>
                  </div>

                  {/* Bottom Nav */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="glass-card rounded-3xl p-3 flex justify-around">
                      <div className="w-8 h-8 rounded-xl bg-primary/20"></div>
                      <div className="w-8 h-8 rounded-xl bg-primary/20"></div>
                      <div className="w-8 h-8 rounded-xl bg-primary/20"></div>
                      <div className="w-8 h-8 rounded-xl bg-primary/20"></div>
                      <div className="w-8 h-8 rounded-xl bg-primary/20"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute top-10 -left-10 glass-card p-4 rounded-2xl animate-float">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute top-40 -right-10 glass-card p-4 rounded-2xl animate-float" style={{ animationDelay: '1s' }}>
              <Map className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* CTA */}
          <div className="glass-card p-8 rounded-[2rem] max-w-lg mx-auto mb-12">
            <Smartphone className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Descarcă aplicația pe mobil
            </h3>
            <p className="text-muted-foreground mb-6">
              TransitFlow este optimizată pentru telefoane mobile. Scanează codul QR sau accesează link-ul de pe telefonul tău.
            </p>
            
            {/* QR Code Placeholder */}
            <div className="w-48 h-48 mx-auto glass rounded-2xl flex items-center justify-center mb-6">
              <div className="text-6xl">📱</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="gradient-primary rounded-full h-12 px-8 text-base shadow-xl">
                <span className="mr-2">📱</span>
                App Store
              </Button>
              <Button className="gradient-primary rounded-full h-12 px-8 text-base shadow-xl">
                <span className="mr-2">🤖</span>
                Google Play
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="glass-card p-6 rounded-[2rem] text-center hover-lift">
              <div className="w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Economisește timp</h3>
              <p className="text-sm text-muted-foreground">
                Planificare automată și notificări când să pleci
              </p>
            </div>

            <div className="glass-card p-6 rounded-[2rem] text-center hover-lift">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Eco-friendly</h3>
              <p className="text-sm text-muted-foreground">
                Urmărește impactul pozitiv asupra mediului
              </p>
            </div>

            <div className="glass-card p-6 rounded-[2rem] text-center hover-lift">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Tracking live</h3>
              <p className="text-sm text-muted-foreground">
                Vezi în timp real unde sunt vehiculele
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
