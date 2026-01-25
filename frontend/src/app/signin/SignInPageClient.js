'use client'

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

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

const LogoIcon = styled.img`
  width: 2.5rem;
  height: 2.5rem;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3));
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
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

export default function SignInPageClient() {
  const { loading, setLoading, isAuthenticated, setAuthenticatedUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/', { replace: true });
    }
  }, [isAuthenticated, router]);

  // Handle Supabase OAuth callback
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for auth callback in URL
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase session error:', error);
          return;
        }

        if (session) {
          console.log('✅ Supabase session found, exchanging with backend...');
          await handleSupabaseSession(session);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
      }
    };

    handleAuthCallback();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        await handleSupabaseSession(session);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('youtube_summarizer_token');
        localStorage.removeItem('youtube_summarizer_user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSupabaseSession = async (session) => {
    try {
      setLoading(true);
      
      // Exchange Supabase session with backend
      const response = await apiService.post('auth/session', {
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      
      const data = response.data;
      
      if (data.success) {
        // Store Supabase access token (used for backend API calls)
        localStorage.setItem('youtube_summarizer_token', session.access_token);
        
        // Create user data object
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          picture: data.user.picture,
          role: data.user.role || 'user',
          subscription: data.user.subscription,
          backendToken: session.access_token
        };
        
        // Store user data
        localStorage.setItem('youtube_summarizer_user', JSON.stringify(userData));
        
        // Update authentication state
        await setAuthenticatedUser(userData);
        
        // Navigate to home page
        toast.success(`Welcome back, ${userData.name}! 🎉`);
        router.push('/', { replace: true });
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Session exchange error:', error);
      toast.error('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    try {
      setLoading(true);
      console.log('🚀 Starting Supabase Google OAuth...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/signin',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error('Supabase OAuth error:', error);
        toast.error('Failed to start sign-in. Please try again.');
        setLoading(false);
      }
      // If successful, browser will redirect to Google
    } catch (error) {
      console.error('Sign-in error:', error);
      toast.error('Sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <SignInCard
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Logo>
        <LogoIcon 
            src="/Click_Summary_Logo_Updated.png" 
            alt="ClickSummary Logo"
          />
          <LogoText>ClickSummary</LogoText>
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
}