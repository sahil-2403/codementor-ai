import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppErrorBoundary from './components/common/AppErrorBoundary.jsx';
import AppToaster from './components/feedback/AppToaster.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { DataRefreshProvider } from './context/DataRefreshContext.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <DataRefreshProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
          <AppToaster />
        </BrowserRouter>
      </DataRefreshProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
