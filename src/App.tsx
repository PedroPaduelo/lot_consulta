import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, Menu, X, List, UserPlus } from 'lucide-react'; // Added UserPlus
import Sidebar from './components/Sidebar';
import UploadPage from './pages/UploadPage';
import ConsultaPage from './pages/ConsultaPage';
import BatchesPage from './pages/BatchesPage';
import BatchDetailsPage from './pages/BatchDetailsPage';
import LoginPage from './pages/LoginPage';
import UserManagementPage from './pages/UserManagementPage'; // Import User Management Page
import { useAuth } from './contexts/AuthContext';

// Define allowed page types including user management
type PageType = 'upload' | 'consulta' | 'lotes' | 'loteDetalhes' | 'userManagement';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('upload');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, isAdmin } = useAuth(); // Get user profile and isAdmin flag

  // Log profile and isAdmin for debugging
  useEffect(() => {
    console.log("App rendered with profile:", profile?.email, "isAdmin:", isAdmin);
  }, [profile, isAdmin]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const viewBatchDetails = (batchId: string) => {
    setSelectedBatchId(batchId);
    setCurrentPage('loteDetalhes');
  };

  const goBackToBatches = () => {
    setSelectedBatchId(null);
    setCurrentPage('lotes');
  };

  // Function to navigate back from UserManagement or BatchDetails
  const handleBackNavigation = () => {
      // Default back to 'upload' or maybe 'lotes' if coming from details?
      // For simplicity, let's default back to 'upload' unless we add more complex state.
      setCurrentPage('upload');
  };


  const renderPage = () => {
    switch (currentPage) {
      case 'upload':
        return <UploadPage />;
      case 'consulta':
        return <ConsultaPage />;
      case 'lotes':
        return <BatchesPage onViewDetails={viewBatchDetails} />;
      case 'loteDetalhes':
        return selectedBatchId ? (
          <BatchDetailsPage batchId={selectedBatchId} onBack={goBackToBatches} />
        ) : (
          <BatchesPage onViewDetails={viewBatchDetails} /> // Fallback
        );
      case 'userManagement':
        // Ensure only admins can access this page directly
        return isAdmin ? <UserManagementPage onBack={handleBackNavigation} /> : <UploadPage />; // Redirect non-admins
      default:
        return <UploadPage />;
    }
  };

  // Determine the active page for the sidebar highlight
  const getSidebarActivePage = (): 'upload' | 'consulta' | 'lotes' | 'userManagement' => {
      if (currentPage === 'loteDetalhes') return 'lotes';
      if (currentPage === 'userManagement') return 'userManagement';
      if (currentPage === 'consulta') return 'consulta';
      if (currentPage === 'lotes') return 'lotes';
      return 'upload'; // Default
  };


  return (
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
        currentPage={getSidebarActivePage()}
        setCurrentPage={(page) => {
            // Reset batch ID if navigating away from details via sidebar
            if (currentPage === 'loteDetalhes' && page !== 'lotes') {
                setSelectedBatchId(null);
            }
            // Ensure only admins can navigate to user management
            if (page === 'userManagement' && !isAdmin) {
                setCurrentPage('upload'); // Or show an error/redirect
            } else {
                setCurrentPage(page);
            }
        }}
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
        userProfile={profile}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <main className="container mx-auto px-4 py-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// App component with better error handling
function App() {
  const { session, loading } = useAuth();
  
  // Log session state for debugging
  useEffect(() => {
    console.log("App root rendered with session:", session ? "exists" : "none", "loading:", loading);
  }, [session, loading]);

  // If still loading, show nothing (AuthProvider already shows loading spinner)
  if (loading) {
    return null;
  }

  return session ? <AppContent /> : <LoginPage />;
}

export default App;
