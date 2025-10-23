import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Camera, ChevronRight, LogOut, Trash2, Globe, Bell, Moon, Ruler, Shield, FileText, Info, Mail, Loader2, Wallet as WalletIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Wallet from "@/components/Wallet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";

const Profile = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [tempFirstName, setTempFirstName] = useState("");
  const [tempLastName, setTempLastName] = useState("");

  useEffect(() => {
    // Check if user is logged in and fetch profile
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      setUserEmail(session.user.email || null);
      setUserId(session.user.id);

      // Load profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setTempFirstName(profile.first_name || '');
        setTempLastName(profile.last_name || '');
      }

      // Load user preferences
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        // Error loading preferences
      } else if (preferences) {
        setNotificationsEnabled(preferences.notifications_enabled);
        if (preferences.dark_mode_enabled) {
          setTheme('dark');
        } else {
          setTheme('light');
        }
      } else {
        // Create default preferences if they don't exist
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: session.user.id,
            notifications_enabled: true,
            dark_mode_enabled: true,
            language: 'ro',
            units: 'km'
          });

        if (insertError) {
          // Error creating default preferences
        }
      }

      setLoading(false);
    };

    fetchProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, setTheme]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Deconectat",
      description: "Ai fost deconectat cu succes",
    });
    setShowLogoutDialog(false);
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Eroare",
          description: "Trebuie să fii autentificat",
          variant: "destructive"
        });
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-user-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      
      toast({
        title: "Cont șters",
        description: "Contul tău a fost șters definitiv",
      });
      
      setShowDeleteDialog(false);
      navigate("/");
    } catch (error) {
      // Error deleting account
      toast({
        title: "Eroare",
        description: "Nu am putut șterge contul. Te rog încearcă din nou.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = () => {
    toast({
      title: "Feature coming soon",
      description: "Profile picture upload will be available soon.",
    });
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    
    if (!tempFirstName.trim() || !tempLastName.trim()) {
      toast({
        title: "Eroare",
        description: "Prenumele și numele sunt obligatorii",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        first_name: tempFirstName.trim(), 
        last_name: tempLastName.trim() 
      })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Eroare",
        description: "Nu am putut salva modificările",
        variant: "destructive"
      });
    } else {
      setFirstName(tempFirstName.trim());
      setLastName(tempLastName.trim());
      setEditMode(false);
      toast({
        title: "Profil actualizat",
        description: "Modificările au fost salvate cu succes"
      });
    }
  };

  const updatePreference = async (field: string, value: any) => {
    if (!userId) return;

    const { error } = await supabase
      .from('user_preferences')
      .update({ [field]: value })
      .eq('user_id', userId);

    if (error) {
      // Error updating preference
      toast({
        title: "Eroare",
        description: "Nu am putut salva preferința",
        variant: "destructive"
      });
    }
  };

  const handleNotificationsToggle = async (checked: boolean) => {
    setNotificationsEnabled(checked);
    await updatePreference('notifications_enabled', checked);
    toast({
      title: checked ? "Notificări activate" : "Notificări dezactivate",
      description: checked ? "Vei primi notificări push" : "Nu vei mai primi notificări"
    });
  };

  const handleDarkModeToggle = async (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    await updatePreference('dark_mode_enabled', checked);
    toast({
      title: checked ? "Modul întunecat activat" : "Modul luminos activat",
      description: "Tema a fost schimbată"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-4 z-40 px-4 mb-6">
        <div className="glass-card backdrop-blur-xl rounded-[2rem] shadow-2xl max-w-md mx-auto">
          <div className="px-6 py-4 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Profil</h1>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-4 max-w-md mx-auto">
        {/* Tabs for Profile and Wallet */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass-card rounded-2xl p-1">
            <TabsTrigger value="profile" className="rounded-xl">Profil</TabsTrigger>
            <TabsTrigger value="wallet" className="rounded-xl">Wallet</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            {/* Profile Info */}
            <div className="glass-card p-6 rounded-[2rem] space-y-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold">
                  {firstName && lastName ? `${firstName[0]}${lastName[0]}` : 'AV'}
                </span>
              </div>
              <button
                onClick={handleImageUpload}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              {!editMode ? (
                <>
                  <h2 className="text-xl font-bold text-foreground">
                    {firstName && lastName ? `${firstName} ${lastName}` : userEmail?.split('@')[0] || 'Utilizator'}
                  </h2>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-primary hover:bg-transparent mt-1"
                    onClick={() => setEditMode(true)}
                  >
                    Editează profil
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Prenume"
                    value={tempFirstName}
                    onChange={(e) => setTempFirstName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="Nume"
                    value={tempLastName}
                    onChange={(e) => setTempLastName(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleSaveProfile}
                      className="h-7 text-xs"
                    >
                      Salvează
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setEditMode(false);
                        setTempFirstName(firstName);
                        setTempLastName(lastName);
                      }}
                      className="h-7 text-xs"
                    >
                      Anulează
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="glass-card p-4 rounded-[2rem] shadow-xl">
          <h3 className="text-sm font-semibold text-muted-foreground px-3 mb-3">SETĂRI GENERALE</h3>
          
          {/* Notifications */}
          <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Notificări</p>
                <p className="text-xs text-muted-foreground">Push notifications</p>
              </div>
            </div>
            <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationsToggle} />
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Moon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Modul întunecat</p>
                <p className="text-xs text-muted-foreground">Dark theme</p>
              </div>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={handleDarkModeToggle} />
          </div>

          {/* Language */}
          <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Limbă</p>
                <p className="text-xs text-muted-foreground">Română</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Units */}
          <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Ruler className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Unități</p>
                <p className="text-xs text-muted-foreground">Kilometri</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Legal Section */}
        <div className="glass-card p-4 rounded-[2rem] shadow-xl">
          <h3 className="text-sm font-semibold text-muted-foreground px-3 mb-3">LEGAL & SUPORT</h3>
          
          {/* Privacy Policy */}
          <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <p className="font-medium text-foreground">Politica de confidențialitate</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Terms & Conditions */}
          <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <p className="font-medium text-foreground">Termeni și condiții</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Contact */}
          <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <p className="font-medium text-foreground">Contact</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* About */}
          <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Despre aplicație</p>
                <p className="text-xs text-muted-foreground">Versiunea 1.0.0</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Account Actions */}
        <div className="glass-card p-4 rounded-[2rem] shadow-xl">
          <h3 className="text-sm font-semibold text-muted-foreground px-3 mb-3">CONT</h3>
          
          {/* Logout */}
          <button 
            onClick={() => setShowLogoutDialog(true)}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-primary" />
              </div>
              <p className="font-medium text-foreground">Deconectare</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Delete Account */}
          <button 
            onClick={() => setShowDeleteDialog(true)}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-destructive/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <p className="font-medium text-destructive">Șterge contul</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
            </div>
          </TabsContent>

          <TabsContent value="wallet" className="mt-4">
            <Wallet />
          </TabsContent>
        </Tabs>
      </div>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Deconectare</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să te deconectezi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="rounded-full bg-primary">
              Deconectează-te
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge contul</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune este permanentă și nu poate fi anulată. Toate datele tale vor fi șterse definitiv, inclusiv:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Profilul și preferințele tale</li>
                <li>Istoricul călătoriilor</li>
                <li>Toate datele personale</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" disabled={loading}>Anulează</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount} 
              disabled={loading}
              className="rounded-full bg-destructive hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se șterge...
                </>
              ) : (
                "Șterge definitiv"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom fade for nav bar */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-40" />

      <BottomNav />
    </div>
  );
};

export default Profile;
