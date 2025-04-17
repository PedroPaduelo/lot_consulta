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
  const [error, setError] = useState<string | null>(null);

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
        setLoading(true);
        console.log("Getting initial session...");
        
        // Obter sessão atual
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting session:", sessionError);
          setError("Erro ao recuperar sessão");
          setLoading(false);
          return;
        }
        
        console.log("Initial session:", currentSession ? "Found" : "Not found");
        setSession(currentSession);
        
        // Extrair perfil da sessão se existir
        if (currentSession?.user) {
          const userProfile = extractProfileFromSession(currentSession);
          setProfile(userProfile);
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
        setError("Erro ao inicializar autenticação");
      } finally {
        setLoading(false);
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
    }
  };

  const isAdmin = profile?.role === 'admin';

  // Show loading indicator while checking session/profile
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <Spinner size="lg" />
        <p className="mt-3 text-text-primary-light dark:text-text-primary-dark">Carregando...</p>
        {error && (
          <p className="mt-2 text-red-500 dark:text-red-400 text-sm">{error}</p>
        )}
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
