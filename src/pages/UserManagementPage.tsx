import React, { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../utils/supabase'; // Import UserProfile type
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, ShieldCheck, Shield, ArrowLeft, Users, Trash2, RefreshCw } from 'lucide-react'; // Added Users, Trash2, RefreshCw
import Alert from '../components/ui/Alert';
import Spinner from '../components/ui/Spinner';
import Table from '../components/ui/Table'; // Import Table
import Dialog from '../components/ui/Dialog'; // Import Dialog

// Define a type for the user list items from the public.profiles table
interface Profile {
    id: string;
    email?: string | null; // Email might be null initially if sync fails?
    role?: 'admin' | 'operator' | null;
    created_at: string;
    updated_at: string;
    // Add last_sign_in_at if you sync it via trigger/function (more complex)
    // For now, we'll fetch it separately if needed or omit it
}


const UserManagementPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { session, isAdmin, profile: currentAdminProfile } = useAuth(); // Get session, isAdmin flag, and current admin profile

  // State for Create User Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'operator' | 'admin'>('operator');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [errorCreate, setErrorCreate] = useState<string | null>(null);
  const [successCreate, setSuccessCreate] = useState<string | null>(null);

  // State for User List (using Profile type)
  const [users, setUsers] = useState<Profile[]>([]); // Changed type to Profile[]
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  // State for Delete Confirmation (using Profile type)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null); // Changed type to Profile | null
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [errorDelete, setErrorDelete] = useState<string | null>(null);
  const [successDelete, setSuccessDelete] = useState<string | null>(null);


  // Fetch users when component mounts and user is admin
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]); // Re-fetch if isAdmin status changes (though unlikely)

  // Clear messages after a delay
  useEffect(() => {
    const clearMessages = () => {
        setErrorCreate(null);
        setSuccessCreate(null);
        setErrorDelete(null);
        setSuccessDelete(null);
        setErrorUsers(null); // Also clear list errors
    };
    if (errorCreate || successCreate || errorDelete || successDelete || errorUsers) {
        const timer = setTimeout(clearMessages, 5000);
        return () => clearTimeout(timer);
    }
  }, [errorCreate, successCreate, errorDelete, successDelete, errorUsers]);


  // --- fetchUsers remains the same (queries profiles table) ---
  const fetchUsers = async () => {
    if (!isAdmin) { // Check isAdmin flag directly
        setErrorUsers('Acesso negado. Apenas administradores podem listar usuários.');
        return;
    }
    setLoadingUsers(true);
    setErrorUsers(null);
    setUsers([]); // Clear previous list

    try {
        console.log('Fetching users from profiles table...');
        // Admins can select all profiles due to RLS policy "Admins can view all profiles"
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false }); // Order by creation date

        if (error) {
            console.error('Error fetching profiles:', error);
            // Check for RLS violation error (though admin should bypass)
            if (error.code === '42501' || error.message.includes('policy')) {
               throw new Error(`Erro de permissão ao buscar perfis: ${error.message}. Verifique as políticas RLS.`);
            }
            throw new Error(error.message || 'Erro desconhecido ao buscar perfis.');
        }

        console.log('Fetched profiles data:', data);
        if (data) {
            setUsers(data as Profile[]); // Set state with Profile type
        } else {
            setUsers([]); // Set empty array if data is null/undefined
        }

    } catch (err: any) {
        console.error("List users error:", err);
        setErrorUsers(err.message || 'Falha ao buscar usuários.');
    } finally {
        setLoadingUsers(false);
    }
  };
  // --- End of fetchUsers ---


  // --- handleCreateUser remains the same (uses Edge Function) ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !session) {
      setErrorCreate('Acesso negado ou sessão inválida.');
      return;
    }

    setLoadingCreate(true);
    setErrorCreate(null);
    setSuccessCreate(null);
    setErrorDelete(null); // Clear delete errors
    setSuccessDelete(null);

    try {
      console.log('Invoking create-user function...');
      const { data, error: invokeError } = await supabase.functions.invoke('create-user', {
        body: { email, password, role },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (invokeError) {
        console.error('Function invoke error (create-user):', invokeError);
        let detailedError = invokeError.message;
        try {
            // Attempt to parse Supabase Edge Function error context if available
            const errorContext = (invokeError as any).context;
            if (errorContext && typeof errorContext.responseText === 'string') {
                const errorJson = JSON.parse(errorContext.responseText || '{}');
                if (errorJson.error) { detailedError = errorJson.error; }
            }
        } catch (parseErr) {
             console.warn("Could not parse error context:", parseErr);
        }
        throw new Error(detailedError || 'Erro desconhecido ao chamar a função.');
      }

      console.log('Function response data (create-user):', data);
      setSuccessCreate(data.message || 'Usuário criado com sucesso!');
      // Clear form
      setEmail('');
      setPassword('');
      setRole('operator');
      // Refresh user list after creation
      fetchUsers(); // This will now fetch from profiles table

    } catch (err: any) {
      console.error("Create user error:", err);
      setErrorCreate(err.message || 'Falha ao criar usuário.');
    } finally {
      setLoadingCreate(false);
    }
  };
  // --- End of handleCreateUser ---

  // --- handleDeleteUserClick remains the same (uses Profile type) ---
  const handleDeleteUserClick = (user: Profile) => { // Changed type to Profile
      if (user.id === currentAdminProfile?.id) {
          setErrorDelete("Você não pode excluir sua própria conta.");
          return;
      }
      setUserToDelete(user);
      setIsDeleteDialogOpen(true);
      setErrorDelete(null); // Clear previous delete errors
      setSuccessDelete(null);
  };
  // --- End of updated handleDeleteUserClick ---

  // --- Updated confirmDeleteUser to use RPC ---
  const confirmDeleteUser = async () => {
      if (!userToDelete || !session) { // Still need session to ensure caller is authenticated
          setErrorDelete("Usuário não selecionado ou sessão inválida.");
          setIsDeleteDialogOpen(false);
          return;
      }

      setLoadingDelete(true);
      setErrorDelete(null);
      setSuccessDelete(null);

      try {
          console.log(`Calling RPC delete_user_rpc for user ID: ${userToDelete.id}`);
          // Call the RPC function instead of invoking the Edge Function
          const { data: rpcResponse, error: rpcError } = await supabase.rpc('delete_user_rpc', {
              user_id_to_delete: userToDelete.id
          });

          if (rpcError) {
              console.error('RPC error (delete_user_rpc):', rpcError);
              // Attempt to extract a more specific message if possible
              const message = rpcError.details || rpcError.message || 'Erro desconhecido ao chamar RPC.';
              throw new Error(message);
          }

          console.log('RPC response data (delete_user_rpc):', rpcResponse);

          // Check the response structure from the RPC function
          if (rpcResponse && rpcResponse.success === false && rpcResponse.error) {
              // Handle errors returned explicitly by the RPC function
              throw new Error(rpcResponse.error);
          } else if (rpcResponse && rpcResponse.success === true) {
              // Handle success
              setSuccessDelete(rpcResponse.message || 'Usuário excluído com sucesso!');
              // Refresh user list after deletion
              fetchUsers(); // This will now fetch from profiles table
          } else {
              // Handle unexpected response structure
              console.warn('Unexpected RPC response structure:', rpcResponse);
              throw new Error('Resposta inesperada da função de exclusão.');
          }

      } catch (err: any) {
          console.error("Delete user error (RPC):", err);
          // Display the error message from the catch block
          setErrorDelete(err.message || 'Falha ao excluir usuário via RPC.');
      } finally {
          setLoadingDelete(false);
          setIsDeleteDialogOpen(false);
          setUserToDelete(null);
      }
  };
  // --- End of updated confirmDeleteUser ---

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        // Check if date is valid before formatting
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return 'Data inválida'; }
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
    <div className="space-y-8">
       {/* --- Create User Section (No changes needed here) --- */}
       <div>
           <div className="flex items-center mb-6">
             <button
               onClick={onBack}
               className="p-2 rounded-lg hover:bg-muted-light dark:hover:bg-muted-dark text-text-secondary-light dark:text-text-secondary-dark mr-3 transition-colors duration-150"
               title="Voltar"
             >
               <ArrowLeft className="h-5 w-5" />
             </button>
             <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center">
               <UserPlus className="mr-3 h-6 w-6 text-primary-light dark:text-primary-dark" />
               Criar Novo Usuário
             </h1>
           </div>

          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-6 border border-border-light dark:border-border-dark">
            <form onSubmit={handleCreateUser} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="new-user-email" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">Email</label>
                <div className="relative">
                   <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark pointer-events-none" />
                  <input
                    type="email"
                    id="new-user-email"
                    placeholder="Email do Novo Usuário"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input w-full pl-10 pr-4 py-2 border-border-light dark:border-border-dark rounded-lg focus:border-primary-light focus:ring-primary-light dark:focus:border-primary-dark dark:focus:ring-primary-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark transition duration-150 ease-in-out"
                  />
                </div>
              </div>

              {/* Password Input */}
               <div>
                 <label htmlFor="new-user-password" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-1.5">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-secondary-light dark:text-text-secondary-dark pointer-events-none" />
                  <input
                    type="password"
                    id="new-user-password"
                    placeholder="Senha (mínimo 6 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="form-input w-full pl-10 pr-4 py-2 border-border-light dark:border-border-dark rounded-lg focus:border-primary-light focus:ring-primary-light dark:focus:border-primary-dark dark:focus:ring-primary-dark bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark transition duration-150 ease-in-out"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Função (Role)
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-border-light dark:border-border-dark hover:bg-muted-light dark:hover:bg-muted-dark has-[:checked]:bg-blue-100 dark:has-[:checked]:bg-blue-900/50 has-[:checked]:border-primary-light dark:has-[:checked]:border-primary-dark transition-colors duration-150">
                    <input
                      type="radio"
                      name="role"
                      value="operator"
                      checked={role === 'operator'}
                      onChange={() => setRole('operator')}
                      className="form-radio h-4 w-4 text-primary-light dark:text-primary-dark focus:ring-primary-light dark:focus:ring-primary-dark border-gray-300 dark:border-gray-600 bg-surface-light dark:bg-surface-dark"
                    />
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">Operador</span>
                  </label>
                  {/* FIX: Complete the className string below */}
                  <label className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border border-border-light dark:border-border-dark hover:bg-muted-light dark:hover:bg-muted-dark has-[:checked]:bg-red-100 dark:has-[:checked]:bg-red-900/50 has-[:checked]:border-red-500 dark:has-[:checked]:border-red-600 transition-colors duration-150">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={() => setRole('admin')}
                      className="form-radio h-4 w-4 text-primary-light dark:text-primary-dark focus:ring-primary-light dark:focus:ring-primary-dark border-gray-300 dark:border-gray-600 bg-surface-light dark:bg-surface-dark"
                    />
                    <ShieldCheck className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">Admin</span>
                  </label>
                </div>
              </div>

              {/* Feedback Messages */}
              {errorCreate && <Alert type="error" message={errorCreate} />}
              {successCreate && <Alert type="success" message={successCreate} />}

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-light dark:bg-primary-dark text-white rounded-lg font-semibold hover:bg-primary-hover-light dark:hover:bg-primary-hover-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark disabled:opacity-60 disabled:cursor-not-allowed flex items-center transition-all duration-200 ease-in-out shadow-sm hover:shadow-md"
                  disabled={loadingCreate}
                >
                  {loadingCreate ? (
                    <>
                      <Spinner size="sm" color="white" className="mr-2" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 mr-2" />
                      Criar Usuário
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
       </div>

       {/* --- User List Section --- */}
       <div>
           <div className="flex items-center justify-between mb-6">
             <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center">
               <Users className="mr-3 h-6 w-6 text-primary-light dark:text-primary-dark" />
               Usuários Cadastrados
             </h1>
             <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="px-4 py-2 bg-primary-light dark:bg-primary-dark text-white rounded-lg font-medium text-sm hover:bg-primary-hover-light dark:hover:bg-primary-hover-dark focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark focus:ring-offset-2 dark:focus:ring-offset-background-dark flex items-center disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 ease-in-out shadow-sm hover:shadow-md"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                {loadingUsers ? 'Atualizando...' : 'Atualizar Lista'}
              </button>
           </div>

           <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-card dark:shadow-card-dark p-6 border border-border-light dark:border-border-dark">
                {/* Feedback Messages for List/Delete */}
                {errorUsers && <Alert type="error" message={errorUsers} />}
                {errorDelete && <Alert type="error" message={errorDelete} />}
                {successDelete && <Alert type="success" message={successDelete} />}

                {loadingUsers && users.length === 0 ? (
                    <div className="text-center py-10">
                        <Spinner size="lg" />
                        <p className="mt-3 text-text-secondary-light dark:text-text-secondary-dark">Carregando usuários...</p>
                    </div>
                ) : !loadingUsers && users.length === 0 && !errorUsers ? (
                    <p className="text-center text-text-secondary-light dark:text-text-secondary-dark py-10">Nenhum usuário encontrado.</p>
                ) : users.length > 0 ? (
                    <Table headers={['Email', 'Role', 'Criado em', 'Ações']}>
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-muted-light/70 dark:hover:bg-muted-dark/70 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                                    {user.email || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                        user.role === 'admin'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-300 dark:border-red-700'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                                    }`}>
                                        {user.role === 'admin' && <ShieldCheck className="h-3 w-3 mr-1" />}
                                        {user.role || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                    {formatDate(user.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                    <button
                                        onClick={() => handleDeleteUserClick(user)}
                                        disabled={loadingDelete || user.id === currentAdminProfile?.id} // Disable if deleting or it's the current admin
                                        className="p-1.5 rounded-md text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={user.id === currentAdminProfile?.id ? "Não pode excluir a própria conta" : "Excluir usuário"}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </Table>
                ) : null}
           </div>
       </div>

       {/* Delete Confirmation Dialog */}
       <Dialog
         isOpen={isDeleteDialogOpen}
         onClose={() => setIsDeleteDialogOpen(false)}
         onConfirm={confirmDeleteUser}
         title="Confirmar Exclusão de Usuário"
         confirmText={loadingDelete ? 'Excluindo...' : 'Excluir'}
         confirmButtonClass={`bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-600 ${loadingDelete ? 'opacity-70 cursor-wait' : ''}`}
       >
         <p>Tem certeza que deseja excluir o usuário <strong>{userToDelete?.email || 'este usuário'}</strong>?</p>
         <p className="mt-1 text-sm">Esta ação removerá permanentemente o usuário do sistema de autenticação e seus dados associados (como perfil).</p>
         <p className="mt-2 font-medium text-red-600 dark:text-red-400">Esta ação não pode ser desfeita.</p>
       </Dialog>
    </div>
  );
};

export default UserManagementPage;
