import React from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

interface DashboardMainViewProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  onNavigate: (view: string, param?: string) => void;
  onShowDetail: (type: 'business-trip' | 'expense', id: string) => void;
}

function DashboardMainView({ 
  isSidebarOpen, 
  toggleSidebar, 
  onNavigate, 
  onShowDetail 
}: DashboardMainViewProps) {
  return (
    <>
      {/* TopBar - Full Width */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopBar onMenuClick={toggleSidebar} onNavigate={onNavigate} />
      </div>

      <div className="flex pt-16 h-screen relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <Sidebar isOpen={true} onClose={() => {}} onNavigate={onNavigate} currentView="dashboard" />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            />
            <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 lg:hidden">
              <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={onNavigate} currentView="dashboard" />
            </div>
          </>
        )}

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <MainContent onNavigate={onNavigate} onShowDetail={onShowDetail} />
        </div>
      </div>
    </>
  );
}

export default DashboardMainView;
