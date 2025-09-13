import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import config from '../../config/environment';
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

const NavLink = styled(Link)`
  color: #374151;
  font-weight: 500;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;

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

const SignInButton = styled(Link)`
  color: #374151;
  font-weight: 500;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: #8b5cf6;
    background: rgba(139, 92, 246, 0.08);
  }
`;

const GetStartedButton = styled(Link)`
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  font-weight: 600;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
  }
`;

const UserProfile = styled.div`
  position: relative;
`;

const ProfileButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.05);
  }
`;

// UserAvatar now replaced with Avatar component

const UserName = styled.span`
  color: #374151;
  font-weight: 500;
  font-size: 14px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 768px) {
    display: none;
  }
`;

const DropdownArrow = styled.span`
  color: #6b7280;
  font-size: 12px;
  transition: transform 0.2s ease;
  ${props => props.$isOpen && 'transform: rotate(180deg);'}
`;

const Dropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  min-width: 280px;
  z-index: 1001;
`;

const DropdownHeader = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
`;

// DropdownAvatar now replaced with Avatar component

const DropdownUserInfo = styled.div`
  flex: 1;
`;

const DropdownUserName = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const DropdownUserEmail = styled.div`
  font-size: 13px;
  opacity: 0.9;
  margin-top: 2px;
`;

const DropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #374151;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.2s ease;

  &:hover {
    background: #f9fafb;
  }
`;

const DropdownIcon = styled.span`
  font-size: 16px;
  width: 20px;
  text-align: center;
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 8px 0;
`;

const SignOutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  background: none;
  border: none;
  color: #dc2626;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #fef2f2;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 24px;
  color: #374151;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Navigation = () => {
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    console.log('🚪 Navigation: Starting signout process...');
    
    // Immediately set signing out state to prevent avatar loading
    setIsSigningOut(true);
    setIsDropdownOpen(false);
    
    try {
      await signOut();
      console.log('✅ Navigation: Signout completed');
    } catch (error) {
      console.error('❌ Navigation: Signout failed:', error);
    } finally {
      // Reset signing out state (though component may unmount)
      setTimeout(() => {
        setIsSigningOut(false);
      }, 1000);
    }
  };

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.15,
        ease: "easeIn"
      }
    }
  };

  return (
    <NavContainer>
      <NavContent>
        <Brand to="/">
          <LogoImage 
            src="/Click_Summary_Logo_Updated.png" 
            alt="ClickSummary Logo"
          />
          <span>ClickSummary</span>
        </Brand>

        <NavLinks>
          <NavLink to="/" $active={location.pathname === '/'}>
            Home
          </NavLink>
          <NavLink to="/pricing" $active={location.pathname === '/pricing'}>
            Pricing
          </NavLink>
        </NavLinks>

        <AuthSection>
          {!isAuthenticated || isSigningOut ? (
            <>
              <SignInButton to="/signin">Sign In</SignInButton>
              <GetStartedButton to="/pricing">Get Started</GetStartedButton>
            </>
          ) : (
            <UserProfile ref={dropdownRef}>
              <ProfileButton
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Avatar 
                  src={(!isSigningOut && !loading && isAuthenticated && user?.picture) ? user.picture : null} 
                  alt={user?.name || 'User'}
                  name={user?.name}
                  size="32px"
                />
                <UserName>{user?.name}</UserName>
                <DropdownArrow $isOpen={isDropdownOpen}>▼</DropdownArrow>
              </ProfileButton>

              <AnimatePresence>
                {isDropdownOpen && (
                  <Dropdown
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <DropdownHeader>
                      <Avatar 
                        src={(!isSigningOut && !loading && isAuthenticated && user?.picture) ? user.picture : null} 
                        alt={user?.name || 'User'}
                        name={user?.name}
                        size="48px"
                        border="2px solid rgba(255, 255, 255, 0.3)"
                      />
                      <DropdownUserInfo>
                        <DropdownUserName>{user?.name}</DropdownUserName>
                        <DropdownUserEmail>{user?.email}</DropdownUserEmail>
                      </DropdownUserInfo>
                    </DropdownHeader>

                    <DropdownItem to="/pricing" onClick={() => setIsDropdownOpen(false)}>
                      <DropdownIcon>💳</DropdownIcon>
                      Subscription
                    </DropdownItem>

                    <DropdownItem 
                      as="a" 
                      href={`https://chrome.google.com/webstore/detail/${config.EXTENSION_ID}`}
                      target="_blank"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <DropdownIcon>🌐</DropdownIcon>
                      Add to Chrome
                    </DropdownItem>

                    <DropdownDivider />

                    <SignOutButton onClick={handleSignOut}>
                      <DropdownIcon>🚪</DropdownIcon>
                      Sign Out
                    </SignOutButton>
                  </Dropdown>
                )}
              </AnimatePresence>
            </UserProfile>
          )}

          <MobileMenuButton>☰</MobileMenuButton>
        </AuthSection>
      </NavContent>
    </NavContainer>
  );
};

export default Navigation;
