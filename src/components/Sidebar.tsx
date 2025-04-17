import React from 'react';
import { FileSpreadsheet, Search, List } from 'lucide-react'; // Import List icon
import ThemeSwitcher from './ui/ThemeSwitcher'; // Import ThemeSwitcher

interface SidebarProps {
  currentPage: 'upload' | 'consulta' | 'lotes';
  setCurrentPage: (page: 'upload' | 'consulta' | 'lotes') => void;
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  isOpen,
  closeSidebar
}) => {
  const handleNavigation = (page: 'upload' | 'consulta' | 'lotes') => {
    setCurrentPage(page);
    closeSidebar();
  };

  const getButtonClasses = (page: 'upload' | 'consulta' | 'lotes') => {
    const baseClasses = 'w-full flex items-center px-6 py-3 text-left transition-colors duration-150 text-sm font-medium'; // Added text-sm and font-medium
    const activeClasses = 'bg-muted-light dark:bg-muted-dark text-primary-light dark:text-primary-dark border-r-4 border-primary-light dark:border-primary-dark';
    const inactiveClasses = 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-muted-light dark:hover:bg-muted-dark hover:text-text-primary-light dark:hover:text-text-primary-dark';

    return `${baseClasses} ${currentPage === page ? activeClasses : inactiveClasses}`;
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
        flex flex-col border-r border-border-light dark:border-border-dark // Added border
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-border-light dark:border-border-dark">
          <h1 className="text-xl font-semibold text-primary-light dark:text-primary-dark flex items-center gap-2"> {/* Adjusted size/weight */}
            <FileSpreadsheet className="h-7 w-7" /> {/* Adjusted size */}
            <span>CPF Validator</span>
          </h1>
        </div>

        <nav className="mt-4 flex-grow"> {/* Adjusted margin */}
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
          </ul>
        </nav>

        {/* Theme Switcher */}
        <div className="p-4 mt-auto border-t border-border-light dark:border-border-dark">
           <ThemeSwitcher />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
