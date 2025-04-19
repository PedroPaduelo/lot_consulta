import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, Menu, X, List, UserPlus, BarChart2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import UploadPage from './pages/UploadPage';
import ConsultaPage from './pages/ConsultaPage';
import BatchesPage from './pages/BatchesPage';
import BatchDetailsPage from './pages/BatchDetailsPage';
import LoginPage from './pages/LoginPage';
import UserManagementPage from './pages/UserManagementPage';
import DashboardPage from './pages/DashboardPage';
import { useAuth } from './contexts/AuthContext';
import Spinner from './components/ui/Spinner';

// Define allowed page types including dashboard and user management
type PageType = 'dashboard' | 'upload' | 'consulta' | 'lotes' | 'loteDetalhes' | 'userManagement';

// This component remains the main UI structure when logged in
function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard'); // Default to dashboard
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, isAdmin } = useAuth(); // useAuth is safe here as AppContent is rendered inside AppLayout

  // Log profile and isAdmin for debugging
  useEffect(() => {
    console.log("AppContent rendered with profile:", profile?.email, "isAdmin:", isAdmin);
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
      // Default back to 'dashboard'
      setCurrentPage('dashboard');
  };


  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
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
        return isAdmin ? <UserManagementPage onBack={handleBackNavigation} /> : <DashboardPage />; // Redirect non-admins to dashboard
      default:
        return <DashboardPage />; // Default to dashboard
    }
  };

  // Determine the active page for the sidebar highlight
  const getSidebarActivePage = (): 'dashboard' | 'upload' | 'consulta' | 'lotes' | 'userManagement' => {
      if (currentPage === 'loteDetalhes') return 'lotes';
      if (currentPage === 'userManagement') return 'userManagement';
      if (currentPage === 'consulta') return 'consulta';
      if (currentPage === 'lotes') return 'lotes';
      if (currentPage === 'upload') return 'upload';
      return 'dashboard'; // Default
  };


  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">
      {/* Mobile sidebar toggle */}
      <button
        className="lg:hidden fixed z-30 top-4 left-4 p-2 rounded-md bg-surface-light dark:bg-surface-dark shadow-lg text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark" // Increased z-index, added border
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
                setCurrentPage('dashboard'); // Redirect non-admins to dashboard
            } else {
                setCurrentPage(page);
            }
            // Close sidebar on navigation in mobile view
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            }
        }}
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
        userProfile={profile}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"> {/* Added padding */}
        <main className="container mx-auto"> {/* Removed extra padding here */}
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// New component to handle auth state and loading
function AppLayout() {
  const { session, loading } = useAuth(); // Call useAuth here

  // Log session state for debugging
  useEffect(() => {
    console.log("AppLayout rendered with session:", session ? "exists" : "none", "loading:", loading);
  }, [session, loading]);

  // If still loading the initial session/profile, show the loading indicator
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background-light dark:bg-background-dark">
        <Spinner size="lg" />
        <p className="mt-3 text-text-primary-light dark:text-text-primary-dark">Carregando...</p>
      </div>
    );
  }

  // Once loading is false, render based on session existence
  return session ? <AppContent /> : <LoginPage />;
}

// The main App component now just renders the AppLayout
// It doesn't need to call useAuth directly anymore
function App() {
  return <AppLayout />;
}

export default App;
