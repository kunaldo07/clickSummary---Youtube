import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

// Global cache to prevent repeated attempts for failed URLs
const failedUrlCache = new Set();
const retryCountCache = new Map();
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Periodically clear failed URL cache to allow retrying after some time
setInterval(() => {
  const cacheSize = failedUrlCache.size;
  if (cacheSize > 0) {
    console.log(`🧹 Clearing ${cacheSize} failed avatar URLs from cache`);
    failedUrlCache.clear();
    retryCountCache.clear();
  }
}, CACHE_CLEANUP_INTERVAL);

const AvatarContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const AvatarImage = styled.img`
  width: ${props => props.size || '32px'};
  height: ${props => props.size || '32px'};
  border-radius: 50%;
  object-fit: cover;
  transition: opacity 0.2s ease;
  ${props => props.border && `border: ${props.border};`}
`;

const FallbackAvatar = styled.div`
  width: ${props => props.size || '32px'};
  height: ${props => props.size || '32px'};
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: ${props => {
    const size = parseInt(props.size) || 32;
    return `${Math.max(10, size * 0.4)}px`;
  }};
  ${props => props.border && `border: ${props.border};`}
`;

const LoadingAvatar = styled.div`
  width: ${props => props.size || '32px'};
  height: ${props => props.size || '32px'};
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  ${props => props.border && `border: ${props.border};`}
  
  &::after {
    content: '';
    width: 50%;
    height: 50%;
    border: 2px solid #d1d5db;
    border-top: 2px solid #8b5cf6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Avatar = ({ 
  src, 
  alt, 
  name, 
  size = '32px',
  border,
  fallbackDelay = 2000
}) => {
  const [imageState, setImageState] = useState('loading');
  const [imageSrc, setImageSrc] = useState(null);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // Get initials from name for fallback
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Attempt to load image with retry logic
  const attemptImageLoad = async (imageUrl, retryCount = 0) => {
    // EARLY EXIT: Don't start loading if component is unmounted or no URL
    if (!mountedRef.current || !imageUrl) {
      console.log('🚫 Avatar: Skipping image load - component unmounted or no URL');
      return;
    }
    
    // Check if this URL has already failed too many times
    if (failedUrlCache.has(imageUrl)) {
      console.log(`🚫 Avatar URL ${imageUrl} is in failed cache, skipping`);
      if (mountedRef.current) {
        setImageState('fallback');
      }
      return;
    }

    // Check retry count
    const currentRetries = retryCountCache.get(imageUrl) || 0;
    if (currentRetries >= MAX_RETRIES) {
      console.log(`🚫 Avatar URL ${imageUrl} exceeded max retries (${MAX_RETRIES}), adding to failed cache`);
      failedUrlCache.add(imageUrl);
      retryCountCache.delete(imageUrl);
      if (mountedRef.current) {
        setImageState('fallback');
      }
      return;
    }

    return new Promise((resolve) => {
      const img = new Image();
      
      // Set timeout for this attempt
      timeoutRef.current = setTimeout(() => {
        console.warn(`⏰ Avatar image timeout (attempt ${currentRetries + 1}/${MAX_RETRIES}): ${imageUrl}`);
        if (currentRetries < MAX_RETRIES - 1) {
          // Retry after delay
          retryCountCache.set(imageUrl, currentRetries + 1);
          setTimeout(() => {
            if (mountedRef.current) {
              attemptImageLoad(imageUrl, currentRetries + 1);
            }
          }, RETRY_DELAY);
        } else {
          // Max retries reached
          failedUrlCache.add(imageUrl);
          retryCountCache.delete(imageUrl);
          if (mountedRef.current) {
            setImageState('fallback');
          }
        }
        resolve();
      }, fallbackDelay);

      img.onload = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Success - clear retry count and set loaded state
        retryCountCache.delete(imageUrl);
        if (mountedRef.current) {
          setImageSrc(imageUrl);
          setImageState('loaded');
        }
        resolve();
      };

      img.onerror = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        console.warn(`❌ Avatar image failed to load (attempt ${currentRetries + 1}/${MAX_RETRIES}): ${imageUrl}`);
        
        // For Google images, try smaller size on first failure
        if (currentRetries === 0 && imageUrl.includes('googleusercontent.com')) {
          const smallerSrc = imageUrl.replace(/=s\d+-c$/, '=s32-c').replace(/=s\d+$/, '=s32');
          if (smallerSrc !== imageUrl) {
            console.log(`🔄 Retrying Google avatar with smaller size: ${smallerSrc}`);
            retryCountCache.set(imageUrl, currentRetries + 1);
            if (mountedRef.current) {
              attemptImageLoad(smallerSrc, 0); // Start fresh with smaller image
            }
            resolve();
            return;
          }
        }
        
        if (currentRetries < MAX_RETRIES - 1) {
          // Retry after delay
          retryCountCache.set(imageUrl, currentRetries + 1);
          setTimeout(() => {
            if (mountedRef.current) {
              attemptImageLoad(imageUrl, currentRetries + 1);
            }
          }, RETRY_DELAY);
        } else {
          // Max retries reached
          failedUrlCache.add(imageUrl);
          retryCountCache.delete(imageUrl);
          if (mountedRef.current) {
            setImageState('fallback');
          }
        }
        resolve();
      };

      img.src = imageUrl;
    });
  };

  useEffect(() => {
    mountedRef.current = true;
    
    // IMMEDIATE SIGNOUT DETECTION: If src becomes null/undefined, immediately stop all loading
    if (!src) {
      console.log('🚪 Avatar: No src provided, immediately switching to fallback (likely signout)');
      
      // Cancel any ongoing loading
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Immediately set fallback state to prevent any HTTP requests
      setImageState('fallback');
      setImageSrc(null);
      return;
    }

    console.log('🖼️ Avatar: Starting image load for:', src?.substring(0, 50) + '...');
    setImageState('loading');
    setImageSrc(null);
    
    // Start loading attempt
    attemptImageLoad(src);

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [src, fallbackDelay]);

  const renderAvatar = () => {
    switch (imageState) {
      case 'loading':
        return <LoadingAvatar size={size} border={border} />;
      
      case 'loaded':
        return (
          <AvatarImage
            src={imageSrc}
            alt={alt}
            size={size}
            border={border}
            onError={() => {
              console.log('🚫 Avatar image failed to render, switching to fallback');
              if (mountedRef.current) {
                setImageState('fallback');
              }
            }}
          />
        );
      
      case 'fallback':
      default:
        return (
          <FallbackAvatar size={size} border={border}>
            {getInitials(name || alt)}
          </FallbackAvatar>
        );
    }
  };

  return (
    <AvatarContainer>
      {renderAvatar()}
    </AvatarContainer>
  );
};

export default Avatar;
