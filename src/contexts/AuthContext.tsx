import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase, getUser, getSession, onAuthStateChange, UserProfile, AuthSession, AuthChangeEvent } from '../utils/supabase';
import Spinner from '../components/ui/Spinner'; // For loading state

interface AuthContextType {
  session: AuthSession;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<AuthSession>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialSession = async () => {
      try {
        console.log("Fetching initial session...");
        const currentSession = await getSession();
        console.log("Initial session:", currentSession ? "Found" : "Not found");
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          console.log("Session has user, fetching profile...");
          const userProfile = await getUser(); // Fetch user with metadata
          console.log("User profile:", userProfile ? "Found" : "Not found", userProfile?.role);
          setProfile(userProfile);
        } else {
          console.log("No user in session");
        }
      } catch (error) {
        console.error("Error fetching initial session:", error);
      } finally {
        console.log("Initial session fetch complete, setting loading to false");
        setLoading(false);
      }
    };

    fetchInitialSession();

    const subscription = onAuthStateChange(async (event: AuthChangeEvent, currentSession: AuthSession) => {
      console.log('Auth event:', event, currentSession ? "Session exists" : "No session");
      setSession(currentSession);
      
      if (event === 'SIGNED_IN' && currentSession?.user) {
        console.log("SIGNED_IN event detected, fetching user profile");
        setLoading(true); // Set loading while fetching profile
        const userProfile = await getUser();
        console.log("User profile after sign in:", userProfile?.role);
        setProfile(userProfile);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log("SIGNED_OUT event detected, clearing profile");
        setProfile(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("TOKEN_REFRESHED event detected");
        // No need to do anything special here, session is already updated
      } else if (event === 'USER_UPDATED') {
        console.log("USER_UPDATED event detected, refreshing profile");
        setLoading(true);
        const userProfile = await getUser();
        setProfile(userProfile);
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up auth subscription");
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      console.log("Signing out...");
      await supabase.auth.signOut();
      // State updates (session, profile) handled by onAuthStateChange listener
    } catch (error) {
      console.error("Error signing out:", error);
      // Handle sign-out error (e.g., show notification)
    }
  };

  const isAdmin = profile?.role === 'admin';

  // Show loading indicator while checking session/profile
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <Spinner size="lg" />
        <p className="ml-3 text-text-primary-light dark:text-text-primary-dark">Carregando...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, isAdmin, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
