import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MainContent from './MainContent';
import BusinessTripApplication from './BusinessTripApplication';
import ExpenseApplication from './ExpenseApplication';
import ApplicationDetail from './ApplicationDetail';
import TaxSimulation from './TaxSimulation';
import TravelRegulationManagement from './TravelRegulationManagement';
import TravelRegulationCreation from './TravelRegulationCreation';
import TravelRegulationHistory from './TravelRegulationHistory';
import DocumentManagement from './DocumentManagement';
import DocumentCreation from './DocumentCreation';
import DocumentPreview from './DocumentPreview';
import NotificationHistory from './NotificationHistory';
import LegalGuide from './LegalGuide';
import ApprovalReminderSettings from './ApprovalReminderSettings';
import ApprovalLinkExpired from './ApprovalLinkExpired';
import MyPage from './MyPage';
import Help from './Help';
import Support from './Support';
import ApplicationStatusList from './ApplicationStatusList';
import AdminDashboard from './AdminDashboard';
import BusinessTripReportCreation from './BusinessTripReportCreation';

function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [applicationDetail, setApplicationDetail] = useState<{type: 'business-trip' | 'expense', id: string} | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigateToView = (view: string, param?: string) => {
    setCurrentView(view);
    if (view === 'document-creation' && param) {
      setDocumentType(param);
    }
    if (view === 'document-preview' && param) {
      setDocumentId(param);
    }
    if (view === 'business-trip-report-creation') {
      // No additional parameters needed for this view
    }
  };

  const showApplicationDetail = (type: 'business-trip' | 'expense', id: string) => {
    setApplicationDetail({ type, id });
    setCurrentView('application-detail');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'business-trip':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="business-trip" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="business-trip" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <BusinessTripApplication onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'expense':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="expense" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="expense" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <ExpenseApplication onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'tax-simulation':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="tax-simulation" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="tax-simulation" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <TaxSimulation onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'travel-regulation-management':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="travel-regulation-management" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="travel-regulation-management" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <TravelRegulationManagement onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'travel-regulation-creation':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="travel-regulation-creation" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="travel-regulation-creation" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <TravelRegulationCreation onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'travel-regulation-history':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="travel-regulation-history" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="travel-regulation-history" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <TravelRegulationHistory onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'document-management':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="document-management" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="document-management" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <DocumentManagement onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'document-creation':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="document-management" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="document-management" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <DocumentCreation onNavigate={navigateToView} documentType={documentType} />
              </div>
            </div>
          </div>
        );
      case 'document-preview':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="document-management" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="document-management" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <DocumentPreview onNavigate={navigateToView} documentId={documentId} />
              </div>
            </div>
          </div>
        );
      case 'notification-history':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="notification-history" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="notification-history" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <NotificationHistory onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'legal-guide':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="legal-guide" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="legal-guide" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <LegalGuide onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'approval-reminder-settings':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="approval-reminder-settings" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="approval-reminder-settings" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <ApprovalReminderSettings onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'approval-link-expired':
        return <ApprovalLinkExpired />;
      case 'my-page':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="my-page" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="my-page" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <MyPage onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="help" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="help" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <Help onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'support':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="support" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="support" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <Support onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'application-status':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="application-status" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="application-status" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <ApplicationStatusList onNavigate={navigateToView} onShowDetail={showApplicationDetail} />
              </div>
            </div>
          </div>
        );
      case 'admin-dashboard':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="admin-dashboard" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="admin-dashboard" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <AdminDashboard onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'business-trip-report-creation':
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="document-management" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="document-management" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <BusinessTripReportCreation onNavigate={navigateToView} />
              </div>
            </div>
          </div>
        );
      case 'application-detail':
        return applicationDetail ? (
          <ApplicationDetail 
            onBack={() => setCurrentView('dashboard')} 
            type={applicationDetail.type}
            applicationId={applicationDetail.id}
          />
        ) : null;
      default:
        return (
          <div className="flex h-screen flex-col">
            <TopBar onMenuClick={toggleSidebar} onNavigate={navigateToView} />
            <div className="flex flex-1">
              <div className="hidden lg:block">
                <Sidebar isOpen={true} onClose={() => {}} onNavigate={navigateToView} currentView="dashboard" />
              </div>
              {isSidebarOpen && (
                <>
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                  />
                  <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 lg:hidden">
                    <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} onNavigate={navigateToView} currentView="dashboard" />
                  </div>
                </>
              )}
              <div className="flex-1">
                <MainContent onNavigate={navigateToView} onShowDetail={showApplicationDetail} />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23334155%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/20 via-transparent to-indigo-100/20"></div>
      {renderCurrentView()}
    </div>
  );
}

export default Dashboard;