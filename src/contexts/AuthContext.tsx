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
        const currentSession = await getSession();
        setSession(currentSession);
        if (currentSession?.user) {
          const userProfile = await getUser(); // Fetch user with metadata
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Error fetching initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialSession();

    const subscription = onAuthStateChange(async (event: AuthChangeEvent, currentSession: AuthSession) => {
      console.log('Auth event:', event, currentSession);
      setSession(currentSession);
      if (event === 'SIGNED_IN' && currentSession?.user) {
        setLoading(true); // Set loading while fetching profile
        const userProfile = await getUser();
        setProfile(userProfile);
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      // Handle other events like USER_UPDATED if needed
      if (event === 'USER_UPDATED') {
         setLoading(true);
         const userProfile = await getUser();
         setProfile(userProfile);
         setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
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
