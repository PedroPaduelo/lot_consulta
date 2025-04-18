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
    // closeSidebar(); // Closing is handled in App.tsx now for mobile
  };

  const getButtonClasses = (page: 'upload' | 'consulta' | 'lotes' | 'userManagement') => {
    const baseClasses = 'w-full flex items-center px-6 py-3 text-left transition-all duration-200 ease-in-out text-sm font-medium group'; // Added group for potential hover effects on icon
    const activeClasses = 'bg-primary-light/10 dark:bg-primary-dark/20 text-primary-light dark:text-primary-dark border-r-4 border-primary-light dark:border-primary-dark font-semibold'; // Refined active style
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
          className="fixed inset-0 z-10 bg-black/60 lg:hidden backdrop-blur-sm" // Darker overlay with blur
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-20  /* Increased z-index */
        w-64 bg-surface-light dark:bg-surface-dark shadow-xl /* Increased shadow */
        transform transition-transform duration-300 ease-in-out
        flex flex-col border-r border-border-light dark:border-border-dark
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-border-light dark:border-border-dark flex items-center gap-3"> {/* Increased padding and gap */}
          <FileSpreadsheet className="h-7 w-7 text-primary-light dark:text-primary-dark flex-shrink-0" />
          <h1 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark truncate">
            CPF Validator
          </h1>
        </div>

        {/* User Info */}
        {userProfile && (
          <div className="px-6 py-5 border-b border-border-light dark:border-border-dark group hover:bg-muted-light dark:hover:bg-muted-dark transition-colors duration-150"> {/* Increased padding, added hover effect */}
            <div className="flex items-center space-x-3">
              <UserCircle className="h-9 w-9 text-text-secondary-light dark:text-text-secondary-dark group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors duration-150 flex-shrink-0" /> {/* Larger icon, hover color */}
              <div className="overflow-hidden"> {/* Prevent text overflow */}
                <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark truncate" title={userProfile.email}>
                  {userProfile.email}
                </p>
                {userProfile.role && (
                  <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                    userProfile.role === 'admin'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-300 dark:border-red-700' // Added border
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700' // Added border
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
        <nav className="mt-5 flex-grow px-2 space-y-1"> {/* Added padding and spacing */}
          <ul>
            <li>
              <button onClick={() => handleNavigation('upload')} className={getButtonClasses('upload')}>
                <FileSpreadsheet className="mr-3 h-5 w-5 flex-shrink-0" />
                Upload de Arquivo
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigation('consulta')} className={getButtonClasses('consulta')}>
                <Search className="mr-3 h-5 w-5 flex-shrink-0" />
                Consulta de CPF
              </button>
            </li>
            <li>
              <button onClick={() => handleNavigation('lotes')} className={getButtonClasses('lotes')}>
                <List className="mr-3 h-5 w-5 flex-shrink-0" />
                Lotes Salvos
              </button>
            </li>
            {/* Admin Only: User Management */}
            {isAdmin && (
              <li>
                <button onClick={() => handleNavigation('userManagement')} className={getButtonClasses('userManagement')}>
                  <UserPlus className="mr-3 h-5 w-5 flex-shrink-0" />
                  Gerenciar Usuários
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 mt-auto border-t border-border-light dark:border-border-dark space-y-4"> {/* Increased spacing */}
           <ThemeSwitcher />
           {/* Logout Button */}
           <button
             onClick={handleLogout}
             className="w-full flex items-center justify-center px-4 py-2 text-left transition-colors duration-200 ease-in-out text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md border border-transparent hover:border-red-200 dark:hover:border-red-800" // Added transition, border on hover
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
