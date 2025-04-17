import React from 'react';
import { FileSpreadsheet, Search, List, LogOut, UserCircle, ShieldCheck, UserPlus } from 'lucide-react'; // Added UserPlus
import ThemeSwitcher from './ui/ThemeSwitcher';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import { UserProfile } from '../utils/supabase'; // Import UserProfile type

interface SidebarProps {
  currentPage: 'upload' | 'consulta' | 'lotes' | 'userManagement'; // Added userManagement
  setCurrentPage: (page: 'upload' | 'consulta' | 'lotes' | 'userManagement') => void; // Added userManagement
  isOpen: boolean;
  closeSidebar: () => void;
  userProfile: UserProfile | null; // Receive user profile
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  isOpen,
  closeSidebar,
  userProfile
}) => {
  const { signOut, isAdmin } = useAuth(); // Get signOut function and isAdmin flag

  const handleNavigation = (page: 'upload' | 'consulta' | 'lotes' | 'userManagement') => {
    setCurrentPage(page);
    closeSidebar();
  };

  const getButtonClasses = (page: 'upload' | 'consulta' | 'lotes' | 'userManagement') => {
    const baseClasses = 'w-full flex items-center px-6 py-3 text-left transition-colors duration-150 text-sm font-medium';
    const activeClasses = 'bg-muted-light dark:bg-muted-dark text-primary-light dark:text-primary-dark border-r-4 border-primary-light dark:border-primary-dark';
    const inactiveClasses = 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-muted-light dark:hover:bg-muted-dark hover:text-text-primary-light dark:hover:text-text-primary-dark';

    return `${baseClasses} ${currentPage === page ? activeClasses : inactiveClasses}`;
  };

  const handleLogout = async () => {
    closeSidebar(); // Close sidebar first
    await signOut();
    // App component will handle redirecting to LoginPage
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-10
        w-64 bg-surface-light dark:bg-surface-dark shadow-lg transform transition-transform duration-300 ease-in-out
        flex flex-col border-r border-border-light dark:border-border-dark
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-border-light dark:border-border-dark">
          <h1 className="text-xl font-semibold text-primary-light dark:text-primary-dark flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7" />
            <span>CPF Validator</span>
          </h1>
        </div>

        {/* User Info */}
        {userProfile && (
          <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center space-x-3">
              <UserCircle className="h-8 w-8 text-text-secondary-light dark:text-text-secondary-dark" />
              <div>
                <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark truncate" title={userProfile.email}>
                  {userProfile.email}
                </p>
                {userProfile.role && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                    userProfile.role === 'admin'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                  }`}>
                    {userProfile.role === 'admin' && <ShieldCheck className="h-3 w-3 mr-1" />}
                    {userProfile.role}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-4 flex-grow">
          <ul>
            <li>
              <button onClick={() => handleNavigation('upload')} className={getButtonClasses('upload')}>
                <FileSpreadsheet className="mr-3 h-5 w-5" />
                Upload de Arquivo
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigation('consulta')} className={getButtonClasses('consulta')}>
                <Search className="mr-3 h-5 w-5" />
                Consulta de CPF
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigation('lotes')} className={getButtonClasses('lotes')}>
                <List className="mr-3 h-5 w-5" />
                Lotes Salvos
              </button>
            </li>
            {/* Admin Only: User Management */}
            {isAdmin && (
              <li>
                <button onClick={() => handleNavigation('userManagement')} className={getButtonClasses('userManagement')}>
                  <UserPlus className="mr-3 h-5 w-5" />
                  Gerenciar Usuários
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 mt-auto border-t border-border-light dark:border-border-dark space-y-3">
           <ThemeSwitcher />
           {/* Logout Button */}
           <button
             onClick={handleLogout}
             className="w-full flex items-center justify-center px-4 py-2 text-left transition-colors duration-150 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
           >
             <LogOut className="mr-2 h-5 w-5" />
             Sair
           </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
