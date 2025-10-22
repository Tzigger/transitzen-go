import { Brain, Clock, Users, Zap, MapPin, Bell } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Predictions",
      description: "Machine learning algorithms predict arrival times with 95% accuracy",
      color: "text-primary",
    },
    {
      icon: Clock,
      title: "Smart Departure Alerts",
      description: "Get notified exactly when to leave based on real-time conditions",
      color: "text-accent",
    },
    {
      icon: Users,
      title: "Crowding Estimates",
      description: "See real-time bus occupancy to plan your most comfortable journey",
      color: "text-warning",
    },
    {
      icon: Zap,
      title: "Fastest Routes",
      description: "Multi-modal route optimization considering all transport options",
      color: "text-success",
    },
    {
      icon: MapPin,
      title: "Live Tracking",
      description: "Watch your bus approach in real-time on the interactive map",
      color: "text-danger",
    },
    {
      icon: Bell,
      title: "Zero Wait Time",
      description: "Minimize waiting at stops with perfectly timed notifications",
      color: "text-primary",
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold">
            Why Choose <span className="gradient-text">TransitIQ</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for Iași, powered by AI. Experience public transport that respects your time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card hover:glass-strong group cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`glass-subtle rounded-2xl p-4 w-fit mb-4 ${feature.color}`}>
                <feature.icon className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 glass-card rounded-3xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Commute?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of Iași residents who never miss their bus
          </p>
          <button className="glass-button bg-gradient-to-r from-primary to-accent text-white text-lg px-8 hover:scale-105">
            Download App
          </button>
        </div>
      </div>
    </section>
  );
};

export default Features;
