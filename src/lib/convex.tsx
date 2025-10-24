import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

const convexUrl = import.meta.env.VITE_CONVEX_URL || "http://localhost:3210";
const convex = new ConvexReactClient(convexUrl);

// Auth context for managing user session
interface AuthContextType {
  userId: Id<"profiles"> | null;
  email: string | null;
  setSession: (userId: Id<"profiles"> | null, email: string | null) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id<"profiles"> | null>(() => {
    const stored = localStorage.getItem("convex_user_id");
    
    // Check if the stored ID looks suspicious (contains patterns from wrong tables)
    // Convex IDs from different tables have different patterns
    // If we detect an issue, clear the storage and force re-login
    if (stored) {
      try {
        // Basic validation: check if it could be a profiles ID
        // This is a temporary fix - proper solution is to ensure correct IDs are stored
        const validIdPattern = /^[a-z0-9]{32}$/;
        if (!validIdPattern.test(stored)) {
          console.warn('Invalid userId format detected, clearing session');
          localStorage.removeItem("convex_user_id");
          localStorage.removeItem("convex_user_email");
          return null;
        }
      } catch (e) {
        console.error('Error validating userId:', e);
        localStorage.removeItem("convex_user_id");
        localStorage.removeItem("convex_user_email");
        return null;
      }
    }
    
    return stored as Id<"profiles"> | null;
  });
  const [email, setEmail] = useState<string | null>(() => {
    // Clear email if userId was cleared
    if (!userId) {
      localStorage.removeItem("convex_user_email");
      return null;
    }
    return localStorage.getItem("convex_user_email");
  });

  const setSession = (newUserId: Id<"profiles"> | null, newEmail: string | null) => {
    setUserId(newUserId);
    setEmail(newEmail);
    if (newUserId && newEmail) {
      localStorage.setItem("convex_user_id", newUserId);
      localStorage.setItem("convex_user_email", newEmail);
    } else {
      localStorage.removeItem("convex_user_id");
      localStorage.removeItem("convex_user_email");
    }
  };

  const clearSession = () => {
    setUserId(null);
    setEmail(null);
    localStorage.removeItem("convex_user_id");
    localStorage.removeItem("convex_user_email");
  };

  return (
    <ConvexProvider client={convex}>
      <AuthContext.Provider value={{ userId, email, setSession, clearSession }}>
        {children}
      </AuthContext.Provider>
    </ConvexProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within ConvexClientProvider");
  }
  return context;
}

export { convex };
