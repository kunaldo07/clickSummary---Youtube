'use client'

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import config from '../../lib/environment';
import Avatar from './Avatar';

const NavContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  transition: all 0.3s ease;
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1f2937;
  text-decoration: none;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.02);
  }
`;

const LogoImage = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3));
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const BrandIcon = styled.span`
  font-size: 1.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLinkWrapper = styled.div`
  color: #374151;
  font-weight: 500;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;

  &:hover {
    color: #8b5cf6;
    background: rgba(139, 92, 246, 0.08);
  }

  ${props => props.$active && `
    color: #8b5cf6;
    background: rgba(139, 92, 246, 0.12);
  `}
`;

const AuthSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const AuthButton = styled.button`
  background: ${props => props.$primary ? 
    'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : 
    'transparent'};
  color: ${props => props.$primary ? 'white' : '#374151'};
  border: ${props => props.$primary ? 'none' : '1px solid #d1d5db'};
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    ${props => props.$primary ? `
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    ` : `
      border-color: #8b5cf6;
      color: #8b5cf6;
    `}
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: #374151;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(139, 92, 246, 0.08);
    color: #8b5cf6;
  }

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid rgba(229, 231, 235, 0.5);
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  padding: 16px;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileNavLink = styled(Link)`
  display: block;
  color: #374151;
  font-weight: 500;
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  margin-bottom: 8px;

  &:hover {
    color: #8b5cf6;
    background: rgba(139, 92, 246, 0.08);
  }

  ${props => props.$active && `
    color: #8b5cf6;
    background: rgba(139, 92, 246, 0.12);
  `}
`;

const MobileAuthSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  margin-top: 16px;
`;

const UserMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid rgba(229, 231, 235, 0.5);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  padding: 8px;
  min-width: 200px;
  z-index: 50;
`;

const UserMenuItem = styled.button`
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {
    background: rgba(139, 92, 246, 0.08);
    color: #8b5cf6;
  }
`;

const UserInfo = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 8px;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
`;

const UserEmail = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Navigation = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Pricing', href: '/pricing' }
  ];

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
  };

  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <NavContainer>
      <NavContent>
        {/* Brand */}
        <Brand href="/">
          <LogoImage 
            src="/Click_Summary_Logo_Updated.png" 
            alt="ClickSummary Logo"
          />
          <span>ClickSummary</span>
        </Brand>

        {/* Desktop Navigation */}
        <NavLinks>
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href} passHref legacyBehavior>
              <NavLinkWrapper $active={isActive(item.href)}>
                {item.name}
              </NavLinkWrapper>
            </Link>
          ))}
        </NavLinks>

        {/* Auth Section */}
        <AuthSection>
          {loading ? (
            <LoadingSpinner />
          ) : isAuthenticated && user ? (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <Avatar 
                user={user}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              />
              
              <AnimatePresence>
                {userMenuOpen && (
                  <UserMenu
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <UserInfo>
                      <UserName>{user.name}</UserName>
                      <UserEmail>{user.email}</UserEmail>
                    </UserInfo>
                    
                    <UserMenuItem onClick={() => window.open('/pricing', '_self')}>
                      <span>💎</span>
                      {user.subscription?.isActive ? 'Manage Subscription' : 'Upgrade to Premium'}
                    </UserMenuItem>
                    
                    <UserMenuItem onClick={handleSignOut}>
                      <span>🚪</span>
                      Sign Out
                    </UserMenuItem>
                  </UserMenu>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link href="/signin" passHref legacyBehavior>
                <AuthButton>Sign In</AuthButton>
              </Link>
              <Link href="/pricing" passHref legacyBehavior>
                <AuthButton $primary>Get Started</AuthButton>
              </Link>
            </>
          )}
        </AuthSection>

        {/* Mobile Menu Button */}
        <MobileMenuButton 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </MobileMenuButton>
      </NavContent>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {navigationItems.map((item) => (
              <MobileNavLink
                key={item.href}
                href={item.href}
                $active={isActive(item.href)}
              >
                {item.name}
              </MobileNavLink>
            ))}
            
            <MobileAuthSection>
              {isAuthenticated && user ? (
                <>
                  <div style={{ padding: '12px 16px' }}>
                    <UserName>{user.name}</UserName>
                    <UserEmail>{user.email}</UserEmail>
                  </div>
                  <AuthButton onClick={handleSignOut}>
                    Sign Out
                  </AuthButton>
                </>
              ) : (
                <>
                  <Link href="/signin" passHref legacyBehavior>
                    <AuthButton>Sign In</AuthButton>
                  </Link>
                  <Link href="/pricing" passHref legacyBehavior>
                    <AuthButton $primary>Get Started</AuthButton>
                  </Link>
                </>
              )}
            </MobileAuthSection>
          </MobileMenu>
        )}
      </AnimatePresence>
    </NavContainer>
  );
};

export default Navigation;
