import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase, UserProfile, AuthSession } from '../utils/supabase';
import Spinner from '../components/ui/Spinner';

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
  const [error, setError] = useState<string | null>(null); // Keep error state if needed for context value

  // Função simplificada para extrair o perfil diretamente da sessão
  const extractProfileFromSession = (currentSession: AuthSession): UserProfile | null => {
    if (!currentSession?.user) return null;

    const user = currentSession.user;
    console.log("Extracting profile from session user:", user.id);
    console.log("User metadata:", user.user_metadata);

    // Criar o perfil com base no usuário da sessão
    const userProfile: UserProfile = {
      ...user,
      role: user.user_metadata?.role as ('admin' | 'operator' | undefined)
    };

    console.log("User role from metadata:", userProfile.role || "No role defined");
    return userProfile;
  };

  useEffect(() => {
    console.log("Setting up auth state...");
    let authListener: { unsubscribe: () => void } | null = null;

    // Função para inicializar a autenticação
    const initializeAuth = async () => {
      try {
        // Keep setLoading(true) here if needed, but provider renders immediately
        setLoading(true);
        setError(null); // Clear previous errors on init
        console.log("Getting initial session...");

        // Obter sessão atual
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setError("Erro ao recuperar sessão"); // Set error state for context consumers
          // Don't return early, let loading finish
        } else {
            console.log("Initial session:", currentSession ? "Found" : "Not found");
            setSession(currentSession);

            // Extrair perfil da sessão se existir
            if (currentSession?.user) {
              const userProfile = extractProfileFromSession(currentSession);
              setProfile(userProfile);
            }
        }

        // Configurar listener para mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          console.log("Auth state change:", event);
          setSession(newSession);

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            if (newSession?.user) {
              const userProfile = extractProfileFromSession(newSession);
              setProfile(userProfile);
            }
          } else if (event === 'SIGNED_OUT') {
            setProfile(null);
          }
        });

        authListener = subscription;
      } catch (err) {
        console.error("Error initializing auth:", err);
        setError("Erro ao inicializar autenticação"); // Set error state
      } finally {
        setLoading(false); // Set loading false after setup attempt
      }
    };

    // Inicializar autenticação
    initializeAuth();

    // Cleanup
    return () => {
      console.log("Cleaning up auth subscription");
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const handleSignOut = async () => {
    try {
      console.log("Signing out...");
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      // Optionally set an error state here if needed
    }
  };

  const isAdmin = profile?.role === 'admin';

  // Always render the provider, passing the loading and error states
  return (
    <AuthContext.Provider value={{ session, profile, loading, isAdmin, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // This error should theoretically not happen now, but keep as safeguard
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
