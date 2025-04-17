import React, { useState } from 'react';
import { FileSpreadsheet, Search, Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import UploadPage from './pages/UploadPage';
import ConsultaPage from './pages/ConsultaPage';

function App() {
  const [currentPage, setCurrentPage] = useState<'upload' | 'consulta'>('upload');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar toggle */}
      <button 
        className="lg:hidden fixed z-20 top-4 left-4 p-2 rounded-md bg-white shadow-md"
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="container mx-auto px-4 py-8">
          {currentPage === 'upload' ? (
            <UploadPage />
          ) : (
            <ConsultaPage />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
