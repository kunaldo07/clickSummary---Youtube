import React, { Suspense, lazy, memo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

// Context Providers
import { AuthProvider } from './hooks/useAuth';
import { PaymentProvider } from './hooks/usePayment';

// Components
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// Lazy-loaded components for performance
const Navigation = memo(lazy(() => import('./components/Navigation/Navigation')));
const Footer = memo(lazy(() => import('./components/Footer/Footer')));

// Lazy-loaded pages with faster loading
const HomePage = lazy(() => import('./pages/HomePage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));

// Global Styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #ffffff;
    color: #1f2937;
    line-height: 1.6;
    overflow-x: hidden;
  }

  html {
    scroll-behavior: smooth;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  ::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Loading Animation */
  .page-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 60vh;
    flex-direction: column;
    gap: 16px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f1f5f9;
    border-top: 3px solid #8b5cf6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-text {
    color: #6b7280;
    font-size: 14px;
    font-weight: 500;
  }
`;

// Loading Component
const PageLoader = () => (
  <div className="page-loading">
    <div className="loading-spinner"></div>
    <div className="loading-text">Loading...</div>
  </div>
);

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

function App() {
  return (
    <ErrorBoundary>
      <GlobalStyle />
      <AuthProvider>
        <PaymentProvider>
          <Router>
            <div className="App">
              <Navigation />
              
              <motion.main
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/signin" element={<SignInPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="*" element={<HomePage />} />
                  </Routes>
                </Suspense>
              </motion.main>

              <Footer />
              
              {/* Toast Notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#1f2937',
                    fontWeight: '500',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    border: '1px solid #e5e7eb'
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff'
                    }
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff'
                    }
                  }
                }}
              />
            </div>
          </Router>
        </PaymentProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
