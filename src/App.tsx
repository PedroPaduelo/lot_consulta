import React, { useState } from 'react';
import { FileSpreadsheet, Search, Menu, X, List } from 'lucide-react';
import Sidebar from './components/Sidebar';
import UploadPage from './pages/UploadPage';
import ConsultaPage from './pages/ConsultaPage';
import BatchesPage from './pages/BatchesPage';
import BatchDetailsPage from './pages/BatchDetailsPage'; // Import BatchDetailsPage

// Define allowed page types + detail view
type PageType = 'upload' | 'consulta' | 'lotes' | 'loteDetalhes';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('upload');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null); // State for selected batch ID
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Function to navigate to batch details
  const viewBatchDetails = (batchId: string) => {
    setSelectedBatchId(batchId);
    setCurrentPage('loteDetalhes');
  };

  // Function to go back to the batches list
  const goBackToBatches = () => {
    setSelectedBatchId(null);
    setCurrentPage('lotes');
  };

  // Function to render the current page component
  const renderPage = () => {
    switch (currentPage) {
      case 'upload':
        return <UploadPage />;
      case 'consulta':
        return <ConsultaPage />;
      case 'lotes':
        // Pass viewBatchDetails function to BatchesPage
        return <BatchesPage onViewDetails={viewBatchDetails} />;
      case 'loteDetalhes':
        // Render BatchDetailsPage only if an ID is selected
        return selectedBatchId ? (
          <BatchDetailsPage batchId={selectedBatchId} onBack={goBackToBatches} />
        ) : (
          // Fallback if no ID (shouldn't happen with proper flow)
          <BatchesPage onViewDetails={viewBatchDetails} />
        );
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
        // Adjust currentPage prop if needed, maybe disable sidebar items on detail page?
        currentPage={currentPage === 'loteDetalhes' ? 'lotes' : currentPage} // Keep 'lotes' active when viewing details
        setCurrentPage={(page) => {
            // Reset batch ID if navigating away from details via sidebar
            if (currentPage === 'loteDetalhes' && page !== 'lotes') {
                setSelectedBatchId(null);
            }
            setCurrentPage(page);
        }}
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
