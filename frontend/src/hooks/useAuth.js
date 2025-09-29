'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

/* global chrome */

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // SIMPLIFIED clear session function (prevents Chrome crashes)
  const clearSession = useCallback(() => {
    console.log('🚪 SIMPLIFIED: Clearing user session...');
    
    if (typeof window !== 'undefined') {
      // Clear localStorage and state immediately
      localStorage.removeItem('youtube_summarizer_user');
      localStorage.removeItem('youtube_summarizer_token');
    }
    setUser(null);
    setIsAuthenticated(false);
    
    console.log('✅ Website localStorage and state cleared');
    
    // SINGLE simplified extension notification (no overwhelming operations)
    try {
      if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime) {
        console.log('📤 Notifying extension of sign out...');
        window.chrome.runtime.sendMessage({
          action: 'userSignedOut',
          source: 'website_signout'
        }, () => {
          // Simple callback, no complex logic
          if (window.chrome.runtime.lastError) {
            console.log('🗜️ Extension not available');
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Extension notification failed:', error);
    }
    
    // SINGLE auth bridge sync (no multiple delayed calls)
    if (typeof window !== 'undefined' && window.youTubeSummarizerAuthBridge) {
      try {
        console.log('🌉 Triggering auth bridge sync...');
        window.youTubeSummarizerAuthBridge.forceSync();
      } catch (error) {
        console.warn('⚠️ Auth bridge sync failed:', error);
      }
    }
    
    console.log('✅ SIMPLIFIED SIGNOUT COMPLETE');
  }, []);

  // Initialize authentication on app load - Optimized for speed
  const initializeAuth = useCallback(async () => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check for existing session
      const userData = localStorage.getItem('youtube_summarizer_user');
      const token = localStorage.getItem('youtube_summarizer_token');
      
      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        
        // Set user immediately for faster UI, verify in background
        setUser(parsedUser);
        setIsAuthenticated(true);
        setLoading(false);
        
        // Verify token in background (non-blocking)
        authService.verifyToken()
          .then(profile => {
            if (profile.success) {
              setUser(prevUser => ({
                ...prevUser,
                subscription: profile.user.subscription,
                usage: profile.user.usage
              }));
              console.log('✅ Token verification successful');
            } else {
              console.warn('⚠️ Token verification returned unsuccessful, but keeping user logged in');
              // Don't clear session immediately - let user try to use the app
            }
          })
          .catch(error => {
            console.warn('⚠️ Background token verification failed:', error);
            // Only clear session for actual auth failures, not network errors
            if (error.message?.includes('Authentication failed') || error.message?.includes('401')) {
              console.warn('🔒 Token appears to be invalid, clearing session');
              clearSession();
            } else {
              console.log('📡 Keeping user logged in despite verification failure (likely network issue)');
            }
          });
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeAuth();
      
      // SIMPLIFIED: Only listen for critical signout events (no complex operations)
      const handleExtensionSignout = (event) => {
        if (event.detail?.source === 'extension_popup') {
          console.log('🚪 Extension signout received, clearing session');
          clearSession();
        }
      };
      
      // Add basic event listener
      window.addEventListener('youtube_summarizer_signout', handleExtensionSignout);
      
      // Cleanup
      return () => {
        window.removeEventListener('youtube_summarizer_signout', handleExtensionSignout);
      };
    }
  }, [initializeAuth, clearSession]);

  const signInWithGoogle = async (googleCredential) => {
    try {
      setLoading(true);
      
      const response = await authService.signInWithGoogle(googleCredential);
      
      if (response.success) {
        const userData = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          picture: response.user.picture,
          role: response.user.role,
          subscription: response.user.subscription,
          backendToken: response.token
        };
        
        if (typeof window !== 'undefined') {
          // Store in localStorage
          localStorage.setItem('youtube_summarizer_user', JSON.stringify(userData));
          localStorage.setItem('youtube_summarizer_token', response.token);
        }
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        // Send token to extension if available
        await sendTokenToExtension(response.token, userData);
        
        toast.success(`Welcome back, ${userData.name}! 🎉`);
        
        return { success: true, user: userData };
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
      toast.error('Sign-in failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Call backend signout (optional)
      try {
        await authService.signOut();
      } catch (error) {
        console.warn('Backend signout failed:', error);
      }
      
      // Clear session
      clearSession();
      
      toast.success('Successfully signed out');
      
      return { success: true };
    } catch (error) {
      console.error('Sign-out failed:', error);
      clearSession(); // Clear session anyway
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const sendTokenToExtension = useCallback(async (token, user) => {
    try {
      // Check if we're in a Chrome extension context
      if (typeof window !== 'undefined' && window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage) {
        window.chrome.runtime.sendMessage({
          action: 'storeUserToken',
          token: token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture,
            role: user.role,
            subscription: user.subscription
          }
        }, (response) => {
          if (window.chrome.runtime.lastError) {
            console.warn('Extension not available:', window.chrome.runtime.lastError.message);
          } else if (response && response.success) {
            console.log('Token sent to extension successfully');
          }
        });
      } else {
        console.log('Chrome extension API not available (normal for web app)');
      }
    } catch (error) {
      console.warn('Could not send token to extension:', error.message);
    }
  }, []);

  const updateUserSubscription = useCallback((subscription) => {
    if (user && typeof window !== 'undefined') {
      const updatedUser = { ...user, subscription };
      setUser(updatedUser);
      localStorage.setItem('youtube_summarizer_user', JSON.stringify(updatedUser));
    }
  }, [user]);

  const refreshUserData = useCallback(async () => {
    try {
      const profile = await authService.verifyToken();
      if (profile.success) {
        const updatedUser = {
          ...user,
          subscription: profile.user.subscription,
          usage: profile.user.usage
        };
        setUser(updatedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('youtube_summarizer_user', JSON.stringify(updatedUser));
        }
        return updatedUser;
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
    return user;
  }, [user]);

  const setAuthenticatedUser = useCallback(async (userData) => {
    console.log('🔐 Setting authenticated user:', userData.name, userData.email);
    
    // Update state
    setUser(userData);
    setIsAuthenticated(true);
    
    if (typeof window !== 'undefined') {
      // Store in localStorage first
      localStorage.setItem('youtube_summarizer_user', JSON.stringify(userData));
      localStorage.setItem('youtube_summarizer_token', userData.backendToken);
    }
    
    // Send token to extension if available (legacy method)
    await sendTokenToExtension(userData.backendToken, userData);
    
    // Enhanced auth bridge sync with multiple triggers
    console.log('🌉 Triggering enhanced auth bridge sync...');
    
    if (typeof window !== 'undefined') {
      // Method 1: Direct bridge call
      if (window.youTubeSummarizerAuthBridge) {
        try {
          console.log('📡 Method 1: Direct bridge sync');
          await window.youTubeSummarizerAuthBridge.forceSync();
        } catch (error) {
          console.warn('⚠️ Direct bridge sync failed:', error);
        }
      }
      
      // Method 2: PostMessage trigger
      try {
        console.log('📡 Method 2: PostMessage trigger');
        window.postMessage({
          type: 'YOUTUBE_SUMMARIZER_AUTH_SYNC',
          force: true
        }, window.location.origin);
      } catch (error) {
        console.warn('⚠️ PostMessage trigger failed:', error);
      }
      
      // Method 3: Delayed trigger for race conditions
      setTimeout(() => {
        if (window.youTubeSummarizerAuthBridge) {
          console.log('📡 Method 3: Delayed bridge sync');
          window.youTubeSummarizerAuthBridge.syncAuth(true);
        }
      }, 500);
    }
    
    console.log('✅ User authenticated and sync triggered:', userData.name);
  }, [sendTokenToExtension]);

  const value = {
    user,
    loading,
    setLoading,
    isAuthenticated,
    signInWithGoogle,
    signOut,
    updateUserSubscription,
    refreshUserData,
    clearSession,
    setAuthenticatedUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
