import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import config from '../../config/environment';
// Logo import removed

const FooterContainer = styled.footer`
  background: #1f2937;
  color: white;
  padding: 60px 0 30px;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
`;

const FooterContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BrandHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LogoImage = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3));
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const BrandText = styled.span`
  font-size: 1.5rem;
  font-weight: 800;
`;

const BrandDescription = styled.p`
  color: #9ca3af;
  line-height: 1.6;
  max-width: 300px;
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 8px;
`;

const FooterLink = styled(Link)`
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #8b5cf6;
  }
`;

const ExternalLink = styled.a`
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #8b5cf6;
  }
`;

const FooterBottom = styled.div`
  padding-top: 32px;
  border-top: 1px solid #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 768px) {
    justify-content: center;
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: #9ca3af;
  font-size: 0.875rem;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 16px;
`;

const SocialLink = styled.a`
  color: #9ca3af;
  font-size: 1.25rem;
  transition: color 0.2s ease;

  &:hover {
    color: #8b5cf6;
  }
`;

const Footer = () => {
  return (
    <FooterContainer>
      <Container>
        <FooterContent>
          <Brand>
            <BrandHeader>
              <LogoImage 
                src="/Click_Summary_Logo_Updated.png" 
                alt="ClickSummary Logo"
              />
              <BrandText>ClickSummary</BrandText>
            </BrandHeader>
            <BrandDescription>
              Transform YouTube videos into intelligent summaries with AI-powered insights. 
              Save time and learn faster with our secure Chrome extension.
            </BrandDescription>
          </Brand>

          <FooterSection>
            <SectionTitle>Product</SectionTitle>
            <FooterLink to="/">Home</FooterLink>
            <FooterLink to="/pricing">Pricing</FooterLink>
            <ExternalLink href={`https://chrome.google.com/webstore/detail/${config.EXTENSION_ID}`} target="_blank">
              Chrome Extension
            </ExternalLink>
          </FooterSection>

          <FooterSection>
            <SectionTitle>Support</SectionTitle>
            <ExternalLink href="mailto:support@youtubesummarizer.com">
              Contact Support
            </ExternalLink>
            <ExternalLink href="#help">Help Center</ExternalLink>
            <ExternalLink href="#status">System Status</ExternalLink>
          </FooterSection>

          <FooterSection>
            <SectionTitle>Legal</SectionTitle>
            <FooterLink to="/privacy">Privacy Policy</FooterLink>
            <ExternalLink href="#terms">Terms of Service</ExternalLink>
            <ExternalLink href="#cookies">Cookie Policy</ExternalLink>
          </FooterSection>
        </FooterContent>

        <FooterBottom>
          <Copyright>
            &copy; 2025 ClickSummary . All rights reserved.
          </Copyright>
          <SocialLinks>
            <SocialLink href="#twitter" aria-label="Twitter">
              🐦
            </SocialLink>
            <SocialLink href="#github" aria-label="GitHub">
              📱
            </SocialLink>
            <SocialLink href="#discord" aria-label="Discord">
              💬
            </SocialLink>
          </SocialLinks>
        </FooterBottom>
      </Container>
    </FooterContainer>
  );
};

export default Footer;
