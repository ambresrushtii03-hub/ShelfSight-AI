import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles/index.css';

const githubPagesRedirect = new URLSearchParams(window.location.search).get('redirect');
if (githubPagesRedirect) {
  const basePath = import.meta.env.BASE_URL;
  window.history.replaceState(null, '', `${basePath}${githubPagesRedirect.replace(/^\/+/, '')}`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
