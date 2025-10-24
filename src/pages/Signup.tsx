import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/lib/convex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

const signupSchema = z.object({
  firstName: z.string().trim().min(2, "Prenumele trebuie să aibă minim 2 caractere").max(50),
  lastName: z.string().trim().min(2, "Numele trebuie să aibă minim 2 caractere").max(50),
  email: z.string().trim().email("Email invalid"),
  password: z.string().min(6, "Parola trebuie să aibă minim 6 caractere"),
  confirmPassword: z.string()
});

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, setSession } = useAuth();
  const signUp = useMutation(api.auth.signUp);

  useEffect(() => {
    // Check if user is already logged in
    if (userId) {
      navigate("/dashboard");
    }
  }, [userId, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    try {
      signupSchema.parse({
        firstName,
        lastName,
        email,
        password,
        confirmPassword
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Eroare",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      toast({
        title: "Eroare",
        description: "Te rog completează toate câmpurile",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Eroare",
        description: "Parolele nu coincid",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await signUp({
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setSession(result.userId, result.email);
      toast({
        title: "Cont creat cu succes!",
        description: "Bun venit la ZeroWait!",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Eroare la înregistrare",
        description: error.message === "User already exists" 
          ? "Acest email este deja înregistrat" 
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    toast({
      title: "Feature coming soon",
      description: "Google OAuth will be available soon.",
    });
  };

  return (
    <div className="min-h-screen gradient-dark relative overflow-hidden flex items-center justify-center p-4 safe-all-fixed">
      {/* Beautiful animated background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Creează cont</h1>
            <p className="text-muted-foreground">Începe călătoria cu ZeroWait</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground">Prenume</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Ion"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground">Nume</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Popescu"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="adresa@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Parolă</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Minim 6 caractere</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Confirmă parola</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se încarcă...
                </>
              ) : (
                "Creează cont"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-foreground/20"></div>
              <span className="text-sm text-foreground font-semibold">Sau</span>
              <div className="flex-1 border-t border-foreground/20"></div>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full bg-card border-2 border-foreground/20 hover:bg-secondary hover:border-foreground/30 text-foreground"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuă cu Google
          </Button>

          <div className="mt-6 text-center">
            <p className="text-sm text-foreground/80">
              Ai deja cont?{" "}
              <Link to="/login" className="text-primary hover:text-primary/90 underline font-semibold">
                Conectează-te
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
