import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
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

const ContentCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 64px 48px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 500px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 48px 32px;
    margin: 16px;
  }
`;

const ErrorCode = styled.h1`
  font-size: 6rem;
  font-weight: 900;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 4rem;
  }
`;

const ErrorTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const ErrorDescription = styled.p`
  color: #6b7280;
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 32px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled(Link)`
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  font-weight: 600;
  text-decoration: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
  }
`;

const SecondaryButton = styled.button`
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  font-weight: 600;
  border: 2px solid #8b5cf6;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(139, 92, 246, 0.2);
    transform: translateY(-2px);
  }
`;

const NotFoundPage = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <>
      <SEO
        title="Page Not Found - ClickSummary"
        description="The page you're looking for doesn't exist. Return to ClickSummary to discover AI-powered video summaries."
        url="/404"
      />
      <Container>
        <ContentCard
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <ErrorCode>404</ErrorCode>
          <ErrorTitle>Page Not Found</ErrorTitle>
          <ErrorDescription>
            Oops! The page you're looking for doesn't exist. 
            It might have been moved, deleted, or you entered the wrong URL.
          </ErrorDescription>
          <ActionButtons>
            <PrimaryButton to="/">
              Go Home
            </PrimaryButton>
            <SecondaryButton onClick={handleGoBack}>
              Go Back
            </SecondaryButton>
          </ActionButtons>
        </ContentCard>
      </Container>
    </>
  );
};

export default NotFoundPage;
