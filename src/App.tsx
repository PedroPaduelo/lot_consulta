import React, { useState } from 'react';
import { FileSpreadsheet, Search, Menu, X, List } from 'lucide-react'; // Import List
import Sidebar from './components/Sidebar';
import UploadPage from './pages/UploadPage';
import ConsultaPage from './pages/ConsultaPage';
import BatchesPage from './pages/BatchesPage'; // Import BatchesPage

// Define allowed page types
type PageType = 'upload' | 'consulta' | 'lotes';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('upload'); // Use PageType
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Function to render the current page component
  const renderPage = () => {
    switch (currentPage) {
      case 'upload':
        return <UploadPage />;
      case 'consulta':
        return <ConsultaPage />;
      case 'lotes':
        return <BatchesPage />; // Render BatchesPage
      default:
        return <UploadPage />; // Default to upload page
    }
  };

  return (
    // Use defined theme colors
    <div className="flex h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark transition-colors duration-200">
      {/* Mobile sidebar toggle */}
      <button
        className="lg:hidden fixed z-20 top-4 left-4 p-2 rounded-md bg-surface-light dark:bg-surface-dark shadow-md text-text-primary-light dark:text-text-primary-dark"
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
      <div className="flex-1 overflow-y-auto">
        <main className="container mx-auto px-4 py-8">
          {renderPage()} {/* Render the selected page */}
        </main>
      </div>
    </div>
  );
}

export default App;
