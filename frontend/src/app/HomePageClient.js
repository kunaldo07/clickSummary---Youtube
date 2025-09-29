'use client'

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import config from '../lib/environment';
import { redirectToExtension } from '../utils/extensionHelpers';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 72px;
`;

const HeroSection = styled.section`
  padding: 120px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
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

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 900;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.5rem;
  margin-bottom: 48px;
  opacity: 0.9;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const CTAButtons = styled(motion.div)`
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
`;

const PrimaryButton = styled(Link)`
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  font-weight: 700;
  text-decoration: none;
  padding: 16px 32px;
  border-radius: 16px;
  font-size: 1.125rem;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(139, 92, 246, 0.5);
  }
`;

const SecondaryButton = styled(Link)`
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-weight: 600;
  text-decoration: none;
  padding: 16px 32px;
  border-radius: 16px;
  font-size: 1.125rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }
`;

const SecondaryButtonAsButton = styled.button`
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-weight: 600;
  text-decoration: none;
  padding: 16px 32px;
  border-radius: 16px;
  font-size: 1.125rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }
`;

const FeaturesSection = styled.section`
  padding: 100px 0;
  background: #f8fafc;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 64px;
  color: #1f2937;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 48px;
  max-width: 1000px;
  margin: 0 auto;
`;

const FeatureCard = styled(motion.div)`
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 24px;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1f2937;
`;

const FeatureDescription = styled.p`
  color: #6b7280;
  line-height: 1.6;
`;

export default function HomePageClient() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Summaries',
      description: 'Advanced AI technology analyzes video content to provide intelligent, accurate summaries that capture key insights.'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Get comprehensive video summaries in seconds, not minutes. Our optimized processing saves you valuable time.'
    },
    {
      icon: '🎯',
      title: 'Smart Insights',
      description: 'Beyond basic summaries - get key takeaways, action items, and contextual understanding of video content.'
    },
    {
      icon: '💬',
      title: 'Interactive Chat',
      description: 'Ask questions about the video content and get instant answers from our AI that understands the context.'
    },
    {
      icon: '📋',
      title: 'Export & Share',
      description: 'Save summaries in multiple formats and easily share insights with your team or personal knowledge base.'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security. We never store or share your personal content.'
    }
  ];

  return (
    <PageContainer>
        <HeroSection>
          <Container>
            <HeroTitle
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Transform YouTube Videos into Intelligent Summaries
            </HeroTitle>
            <HeroSubtitle
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Save time and learn faster with AI-powered video summarization. 
              Get key insights, action items, and interactive chat - all in seconds.
            </HeroSubtitle>
            <CTAButtons
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {!isAuthenticated ? (
                <>
                  <PrimaryButton href="/pricing">Get Started Free</PrimaryButton>
                  <SecondaryButton href="/signin">Sign In</SecondaryButton>
                </>
              ) : (
                <>
                  <PrimaryButton href="/pricing">Upgrade to Premium</PrimaryButton>
                  <SecondaryButtonAsButton 
                    onClick={redirectToExtension}
                  >
                    Add to Chrome
                  </SecondaryButtonAsButton>
                </>
              )}
            </CTAButtons>
          </Container>
        </HeroSection>

        <FeaturesSection>
          <Container>
            <SectionTitle>Why Choose ClickSummary?</SectionTitle>
            <FeaturesGrid>
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <FeatureIcon>{feature.icon}</FeatureIcon>
                  <FeatureTitle>{feature.title}</FeatureTitle>
                  <FeatureDescription>{feature.description}</FeatureDescription>
                </FeatureCard>
              ))}
            </FeaturesGrid>
        </Container>
      </FeaturesSection>
    </PageContainer>
  );
}
