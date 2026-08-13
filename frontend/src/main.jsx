import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppErrorBoundary from './components/common/AppErrorBoundary.jsx';
import AppToaster from './components/feedback/AppToaster.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import AuthInterceptor from './features/auth/AuthInterceptor.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AuthInterceptor>
            <App />
          </AuthInterceptor>
        </AuthProvider>
        <AppToaster />
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
);
