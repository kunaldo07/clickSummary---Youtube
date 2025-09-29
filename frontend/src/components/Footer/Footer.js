'use client'

import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import config from '../../lib/environment';

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
  flex-direction: column;
  gap: 16px;
  text-align: center;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    text-align: left;
  }
`;

const Copyright = styled.p`
  color: #9ca3af;
  font-size: 0.875rem;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;

  @media (min-width: 768px) {
    justify-content: flex-end;
  }
`;

const SocialLink = styled.a`
  color: #9ca3af;
  font-size: 1.25rem;
  transition: color 0.2s ease;
  text-decoration: none;

  &:hover {
    color: #8b5cf6;
  }
`;

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <Container>
        <FooterContent>
          {/* Brand Section */}
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
              Save time and learn faster with our Chrome extension.
            </BrandDescription>
          </Brand>

          {/* Product Section */}
          <FooterSection>
            <SectionTitle>Product</SectionTitle>
            <FooterLink href="/">Features</FooterLink>
            <FooterLink href="/pricing">Pricing</FooterLink>
            <ExternalLink 
              href={`https://chrome.google.com/webstore/detail/${config.EXTENSION_ID}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chrome Extension
            </ExternalLink>
          </FooterSection>

          {/* Company Section */}
          <FooterSection>
            <SectionTitle>Company</SectionTitle>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            {/* <FooterLink href="/terms">Terms of Service</FooterLink> */}
            <ExternalLink 
              href="mailto:support@clicksummary.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Support
            </ExternalLink>
          </FooterSection>

          {/* Resources Section */}
          <FooterSection>
            <SectionTitle>Resources</SectionTitle>
            <ExternalLink 
              href="https://chrome.google.com/webstore/detail/clicksummary/cijajcbmplbiidgaeooocnfhjhcahnil"
              target="_blank"
              rel="noopener noreferrer"
            >
              Installation Guide
            </ExternalLink>
            <ExternalLink 
              href="mailto:feedback@clicksummary.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Send Feedback
            </ExternalLink>
            <ExternalLink 
              href="mailto:contact@clicksummary.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Us
            </ExternalLink>
          </FooterSection>
        </FooterContent>

        <FooterBottom>
          <Copyright>
            © {currentYear} ClickSummary. All rights reserved.
          </Copyright>
          
          <SocialLinks>
            <SocialLink 
              href="https://twitter.com/clicksummary" 
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              🐦
            </SocialLink>
            <SocialLink 
              href="https://github.com/clicksummary" 
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              📧
            </SocialLink>
            <SocialLink 
              href="mailto:hello@clicksummary.com"
              aria-label="Email"
            >
              ✉️
            </SocialLink>
          </SocialLinks>
        </FooterBottom>
      </Container>
    </FooterContainer>
  );
};

export default Footer;
