import React, { useState } from 'react';
    import { supabase } from '../utils/supabase'; // Import supabase client
    import { useAuth } from '../contexts/AuthContext';
    import { UserPlus, Mail, Lock, ShieldCheck, Shield, ArrowLeft } from 'lucide-react';
    import Alert from '../components/ui/Alert';
    import Spinner from '../components/ui/Spinner';

    const UserManagementPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
      const { session, isAdmin } = useAuth(); // Get session for auth header
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [role, setRole] = useState<'operator' | 'admin'>('operator');
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [success, setSuccess] = useState<string | null>(null);

      const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) {
          setError('Apenas administradores podem criar usuários.');
          return;
        }
        if (!session) {
          setError('Sessão inválida. Faça login novamente.');
          return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
          console.log('Invoking create-user function...');
          const { data, error: invokeError } = await supabase.functions.invoke('create-user', {
            body: { email, password, role },
            headers: {
              // Pass the current user's auth token to the function
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (invokeError) {
            console.error('Function invoke error:', invokeError);
            // Try to parse the error message from the function response if available
            let detailedError = invokeError.message;
            try {
                const errorJson = JSON.parse(invokeError.context?.responseText || '{}');
                if (errorJson.error) {
                    detailedError = errorJson.error;
                }
            } catch (parseErr) { /* Ignore parsing error */ }
            throw new Error(detailedError || 'Erro desconhecido ao chamar a função.');
          }

          console.log('Function response data:', data);
          setSuccess(data.message || 'Usuário criado com sucesso!');
          // Clear form
          setEmail('');
          setPassword('');
          setRole('operator');

        } catch (err: any) {
          console.error("Create user error:", err);
          setError(err.message || 'Falha ao criar usuário.');
        } finally {
          setLoading(false);
        }
      };

      // Redirect or show error if not admin
      if (!isAdmin) {
        return (
          <div className="max-w-4xl mx-auto">
             <Alert type="error" message="Acesso negado. Apenas administradores podem acessar esta página." />
          </div>
        );
      }

      return (
        <div className="max-w-2xl mx-auto">
           {/* Back Button and Title */}
           <div className="flex items-center mb-6">
             <button
               onClick={onBack}
               className="p-2 rounded-md hover:bg-muted-light dark:hover:bg-muted-dark text-text-secondary-light dark:text-text-secondary-dark mr-3"
               title="Voltar"
             >
               <ArrowLeft className="h-5 w-5" />
             </button>
             <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center">
               <UserPlus className="mr-2 h-6 w-6 text-primary-light dark:text-primary-dark" />
               Criar Novo Usuário
             </h1>
           </div>

          <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-md p-6 border border-border-light dark:border-border-dark">
            <form onSubmit={handleCreateUser} className="space-y-5">
              {/* Email Input */}
              <div className="relative">
                 <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark pointer-events-none" />
                <input
                  type="email"
                  placeholder="Email do Novo Usuário"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-border-light dark:border-border-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark transition-colors"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark pointer-events-none" />
                <input
                  type="password"
                  placeholder="Senha (mínimo 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 border border-border-light dark:border-border-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark transition-colors"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Função (Role)
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-border-light dark:border-border-dark hover:bg-muted-light dark:hover:bg-muted-dark has-[:checked]:bg-blue-100 dark:has-[:checked]:bg-blue-900 has-[:checked]:border-primary-light dark:has-[:checked]:border-primary-dark">
                    <input
                      type="radio"
                      name="role"
                      value="operator"
                      checked={role === 'operator'}
                      onChange={() => setRole('operator')}
                      className="form-radio h-4 w-4 text-primary-light dark:text-primary-dark focus:ring-primary-light dark:focus:ring-primary-dark"
                    />
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">Operador</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-border-light dark:border-border-dark hover:bg-muted-light dark:hover:bg-muted-dark has-[:checked]:bg-red-100 dark:has-[:checked]:bg-red-900 has-[:checked]:border-red-500 dark:has-[:checked]:border-red-500">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={() => setRole('admin')}
                      className="form-radio h-4 w-4 text-red-600 dark:text-red-500 focus:ring-red-500 dark:focus:ring-red-600"
                    />
                     <ShieldCheck className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">Admin</span>
                  </label>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && <Alert type="error" message={error} />}
              {success && <Alert type="success" message={success} />}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading || !email || password.length < 6}
                  className="w-full px-6 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-md font-semibold hover:bg-primary-hover-light dark:hover:bg-primary-hover-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-offset-2 dark:focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {loading ? <Spinner size="sm" color="white" className="mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
                  {loading ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    };

    export default UserManagementPage;
