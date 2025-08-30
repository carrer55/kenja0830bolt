import React from 'react';
import AuthWrapper from './components/AuthWrapper';
import { UserProfileProvider } from './components/UserProfileProvider';
import { AuthDebug } from './components/AuthDebug';
import './index.css';

function App() {
  return (
    <UserProfileProvider>
      <AuthWrapper />
      <AuthDebug />
    </UserProfileProvider>
  );
}

export default App;