import React from 'react';
import { FileSpreadsheet, Search } from 'lucide-react';

interface SidebarProps {
  currentPage: 'upload' | 'consulta';
  setCurrentPage: (page: 'upload' | 'consulta') => void;
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  setCurrentPage, 
  isOpen,
  closeSidebar
}) => {
  const handleNavigation = (page: 'upload' | 'consulta') => {
    setCurrentPage(page);
    closeSidebar();
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
        w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8" />
            <span>CPF Validator</span>
          </h1>
        </div>

        <nav className="mt-6">
          <ul>
            <li>
              <button
                onClick={() => handleNavigation('upload')}
                className={`
                  w-full flex items-center px-6 py-3 text-left
                  ${currentPage === 'upload' 
                    ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <FileSpreadsheet className="mr-3 h-5 w-5" />
                Upload de Arquivo
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigation('consulta')}
                className={`
                  w-full flex items-center px-6 py-3 text-left
                  ${currentPage === 'consulta' 
                    ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <Search className="mr-3 h-5 w-5" />
                Consulta de CPF
              </button>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
