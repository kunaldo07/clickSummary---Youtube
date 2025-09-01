import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 72px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="1.5" fill="rgba(255,255,255,0.05)"/><circle cx="40" cy="60" r="0.8" fill="rgba(255,255,255,0.08)"/><circle cx="70" cy="30" r="1.2" fill="rgba(255,255,255,0.06)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    pointer-events: none;
  }
`;

const SignInCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 400px;
  width: 100%;
  margin: 24px;
  text-align: center;
  position: relative;
  z-index: 1;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
`;

const LogoIcon = styled.span`
  font-size: 2.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const LogoText = styled.span`
  font-size: 1.5rem;
  font-weight: 800;
  color: #1f2937;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 16px;
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin-bottom: 32px;
  line-height: 1.6;
`;

const GoogleSignInButton = styled.button`
  width: 100%;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 24px;

  &:hover {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.05);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const GoogleIcon = styled.div`
  width: 20px;
  height: 20px;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="%234285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="%2334A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="%23FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="%23EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>') no-repeat center;
  background-size: contain;
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 32px 0;
  color: #6b7280;
  font-size: 0.875rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  &::before {
    margin-right: 16px;
  }

  &::after {
    margin-left: 16px;
  }
`;

const Features = styled.div`
  text-align: left;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.6;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SignInPage = () => {
  const { signInWithGoogle, loading, setLoading, isAuthenticated, setAuthenticatedUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('OAuth error:', error);
      toast.error('Google sign-in was cancelled or failed.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    if (code && state) {
      const storedState = sessionStorage.getItem('oauth_state');
      
      if (state === storedState) {
        console.log('OAuth callback received, exchanging code for token...');
        handleOAuthCallback(code);
        
        // Clean up
        sessionStorage.removeItem('oauth_state');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        console.error('OAuth state mismatch');
        toast.error('Security error during sign-in.');
      }
    }
  }, []);

  const handleOAuthCallback = async (code) => {
    try {
      setLoading(true);
      
      // Exchange code for token via backend
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/auth/google-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code, 
          redirectUri: window.location.origin + '/signin' 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store token separately
        localStorage.setItem('youtube_summarizer_token', data.token);
        
        // Create user data object
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          picture: data.user.picture,
          role: data.user.role,
          subscription: data.user.subscription,
          backendToken: data.token
        };
        
        // Update authentication state
        await setAuthenticatedUser(userData);
        
        // Navigate to home page
        toast.success(`Welcome back, ${userData.name}! 🎉`);
        navigate('/', { replace: true });
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast.error('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    console.log('=== MANUAL OAUTH FLOW ===');
    
    // Google OAuth URL for manual flow
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '837073239595-d82jmt90dcg6pg1suilajc7rl2auf2b8.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent(window.location.origin + '/signin');
    const scope = encodeURIComponent('profile email');
    const responseType = 'code';
    const state = Math.random().toString(36).substring(2, 15);
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `response_type=${responseType}&` +
      `state=${state}`;
    
    console.log('Redirecting to Google OAuth...');
    
    // Store state for verification
    sessionStorage.setItem('oauth_state', state);
    
    // Redirect to Google OAuth
    window.location.href = googleAuthUrl;
  };

  return (
    <PageContainer>
      <SignInCard
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Logo>
          <LogoIcon>🎥</LogoIcon>
          <LogoText>YouTube Summarizer</LogoText>
        </Logo>

        <Title>Welcome Back!</Title>
        <Subtitle>
          Sign in to access your AI-powered video summaries and premium features.
        </Subtitle>

        <GoogleSignInButton 
          onClick={handleGoogleSignInClick}
          disabled={loading}
        >
          {loading ? (
            <>
              <LoadingSpinner />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </GoogleSignInButton>

        <Divider>What you'll get</Divider>

        <Features>
          <FeatureItem>
            <span>✅</span>
            <span>AI-powered video summaries</span>
          </FeatureItem>
          <FeatureItem>
            <span>✅</span>
            <span>Interactive chat with video content</span>
          </FeatureItem>
          <FeatureItem>
            <span>✅</span>
            <span>Export and share summaries</span>
          </FeatureItem>
          <FeatureItem>
            <span>✅</span>
            <span>Secure data protection</span>
          </FeatureItem>
        </Features>
      </SignInCard>
    </PageContainer>
  );
};

export default SignInPage;
