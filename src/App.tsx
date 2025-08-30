import React from 'react';
import AuthWrapper from './components/AuthWrapper';
import { UserProfileProvider } from './components/UserProfileProvider';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <UserProfileProvider>
        <AuthWrapper />
      </UserProfileProvider>
    </ErrorBoundary>
  );
}

export default App;