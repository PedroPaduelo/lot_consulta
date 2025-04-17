import React, { useState } from 'react';
import { supabase, signInWithPassword } from '../utils/supabase'; // Import signIn function
import { LogIn, Mail, Lock } from 'lucide-react';
import Alert from '../components/ui/Alert';
import Spinner from '../components/ui/Spinner';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithPassword(email, password);
      // No need to redirect here, AuthProvider will detect SIGNED_IN event
      // and App.tsx will render the main content.
      console.log('Login successful, waiting for auth state change...');
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || 'Falha no login. Verifique suas credenciais.');
      setLoading(false);
    }
    // setLoading(false) will be handled by AuthProvider detecting the session change
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background-light to-muted-light dark:from-background-dark dark:to-surface-dark p-4">
      <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl p-8 border border-border-light dark:border-border-dark">
        <div className="text-center mb-8">
           <LogIn className="mx-auto h-12 w-12 text-primary-light dark:text-primary-dark mb-4" />
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">Bem-vindo</h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2">Faça login para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div className="relative">
             <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark transition-colors"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark transition-colors"
            />
          </div>

          {/* Error Message */}
          {error && <Alert type="error" message={error} />}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-primary-light dark:bg-primary-dark text-white rounded-lg font-semibold hover:bg-primary-hover-light dark:hover:bg-primary-hover-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-offset-2 dark:focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 ease-in-out"
            >
              {loading ? <Spinner size="sm" color="white" /> : 'Entrar'}
            </button>
          </div>
        </form>

        {/* Optional: Link to Sign Up */}
        {/* <p className="mt-6 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Não tem uma conta?{' '}
          <a href="#" className="font-medium text-primary-light dark:text-primary-dark hover:underline">
            Registre-se
          </a>
        </p> */}
      </div>
    </div>
  );
};

export default LoginPage;
