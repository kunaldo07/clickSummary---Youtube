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
  
  @media (max-width: 968px) {
    padding: 80px 0;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
`;

const HeroGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 48px;
  }
`;

const HeroContent = styled.div`
  text-align: left;
  
  @media (max-width: 968px) {
    text-align: center;
  }
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 900;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.25rem;
  margin-bottom: 24px;
  opacity: 0.9;
  line-height: 1.6;
  
  @media (max-width: 968px) {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const HeroStats = styled(motion.div)`
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 40px;
  font-size: 0.9rem;
  opacity: 0.95;
  
  @media (max-width: 968px) {
    justify-content: center;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  span:first-child {
    font-size: 1.2rem;
  }
`;

const UrgencyBadge = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 32px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
`;

const CTAButtons = styled(motion.div)`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  
  @media (max-width: 968px) {
    justify-content: center;
  }
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

const HeroDemoContainer = styled(motion.div)`
  position: relative;
  z-index: 1;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  background: #000;
  width: 100%;
  
  @media (max-width: 968px) {
    max-width: 600px;
    margin: 0 auto;
  }
`;

const HeroDemoVideo = styled.video`
  width: 100%;
  height: auto;
  display: block;
  border-radius: 24px;
`;

const HeroBottomSection = styled.div`
  margin-top: 64px;
  text-align: center;
  
  @media (max-width: 968px) {
    margin-top: 48px;
  }
`;

const HeroBottomStats = styled(motion.div)`
  display: flex;
  gap: 32px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 32px;
  font-size: 0.95rem;
  opacity: 0.95;
`;

const HeroBottomButtons = styled(motion.div)`
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
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

const TutorialSection = styled.section`
  padding: 100px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

const TutorialTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 24px;
  color: white;
  position: relative;
  z-index: 1;
`;

const TutorialSubtitle = styled.p`
  font-size: 1.25rem;
  text-align: center;
  margin-bottom: 48px;
  color: rgba(255, 255, 255, 0.9);
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 1;
`;

const VideoContainer = styled(motion.div)`
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  background: #000;
`;

const VideoWrapper = styled.div`
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

const ShowcaseSection = styled.section`
  padding: 100px 0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
`;

const ShowcaseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 48px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: start;
`;

const ShowcaseCard = styled(motion.div)`
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  }
`;

const ShowcaseImageContainer = styled.div`
  width: 100%;
  height: 300px;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ShowcaseImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
`;

const ShowcaseContent = styled.div`
  padding: 32px;
`;

const ShowcaseTitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ShowcaseIcon = styled.span`
  font-size: 2rem;
`;

const ShowcaseDescription = styled.p`
  color: #4b5563;
  line-height: 1.8;
  margin-bottom: 20px;
  font-size: 1rem;
`;

const ShowcaseFeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ShowcaseFeatureItem = styled.li`
  color: #6b7280;
  padding: 8px 0;
  display: flex;
  align-items: start;
  gap: 12px;
  font-size: 0.95rem;

  &:before {
    content: '✓';
    color: #8b5cf6;
    font-weight: bold;
    font-size: 1.2rem;
    flex-shrink: 0;
  }
`;

const SocialProofSection = styled.section`
  padding: 80px 0;
  background: white;
`;

const TestimonialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  margin-top: 48px;
`;

const TestimonialCard = styled(motion.div)`
  background: #f9fafb;
  padding: 32px;
  border-radius: 16px;
  border-left: 4px solid #8b5cf6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const TestimonialText = styled.p`
  color: #374151;
  line-height: 1.7;
  margin-bottom: 20px;
  font-style: italic;
  font-size: 1.05rem;
`;

const TestimonialAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AuthorAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
`;

const AuthorInfo = styled.div`
  flex: 1;
`;

const AuthorName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
`;

const AuthorRole = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const StarsRating = styled.div`
  color: #fbbf24;
  font-size: 1rem;
`;

const ComparisonSection = styled.section`
  padding: 100px 0;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  max-width: 1000px;
  margin: 48px auto 0;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const ComparisonCard = styled(motion.div)`
  background: ${props => props.$type === 'before' ? '#fee2e2' : '#d1fae5'};
  padding: 40px;
  border-radius: 20px;
  position: relative;
`;

const ComparisonLabel = styled.div`
  position: absolute;
  top: -16px;
  left: 24px;
  background: ${props => props.$type === 'before' ? '#ef4444' : '#10b981'};
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
`;

const ComparisonTitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 24px;
  margin-top: 16px;
  color: #1f2937;
`;

const ComparisonList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ComparisonItem = styled.li`
  display: flex;
  align-items: start;
  gap: 12px;
  margin-bottom: 16px;
  color: #374151;
  line-height: 1.6;
  
  &:before {
    content: '${props => props.$type === 'before' ? '❌' : '✅'}';
    font-size: 1.2rem;
    flex-shrink: 0;
  }
`;

const FAQSection = styled.section`
  padding: 100px 0;
  background: white;
`;

const FAQGrid = styled.div`
  max-width: 800px;
  margin: 48px auto 0;
`;

const FAQItem = styled(motion.div)`
  background: #f9fafb;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 20px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #8b5cf6;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
  }
`;

const FAQQuestion = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  &:before {
    content: 'Q:';
    color: #8b5cf6;
    font-weight: 900;
  }
`;

const FAQAnswer = styled.p`
  color: #4b5563;
  line-height: 1.7;
  margin-left: 32px;
`;

const FinalCTASection = styled.section`
  padding: 100px 0;
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

const FinalCTATitle = styled.h2`
  font-size: 3rem;
  font-weight: 900;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const FinalCTASubtitle = styled.p`
  font-size: 1.25rem;
  margin-bottom: 40px;
  opacity: 0.95;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 1;
`;

const TrustBadges = styled.div`
  display: flex;
  gap: 32px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 48px;
  position: relative;
  z-index: 1;
`;

const TrustBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  padding: 12px 24px;
  border-radius: 24px;
  backdrop-filter: blur(10px);
  font-weight: 600;
  font-size: 0.9rem;
  
  span:first-child {
    font-size: 1.2rem;
  }
`;

export default function HomePageClient() {
  const { isAuthenticated } = useAuth();

  // YouTube demo tutorial video ID
  const TUTORIAL_VIDEO_ID = 'AFsacKCxpTA';

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
            <HeroGrid>
              <HeroContent>
                <HeroTitle
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  Stop Wasting Hours Watching Videos
                </HeroTitle>
                <HeroSubtitle
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Get AI-powered summaries of any YouTube video in seconds. Save 20+ hours per week while learning faster and retaining more.
                </HeroSubtitle>
              </HeroContent>
              
              <HeroDemoContainer
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <HeroDemoVideo
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/demo-thumbnail.jpg"
                >
                  <source src="/demo-video.mp4" type="video/mp4" />
                  <source src="/demo-video.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </HeroDemoVideo>
              </HeroDemoContainer>
            </HeroGrid>
            
            <HeroBottomSection>
              <HeroBottomStats
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <StatItem>
                  <span>⭐</span>
                  <span>4.9/5 Rating (10+ reviews)</span>
                </StatItem>
                <StatItem>
                  <span>👥</span>
                  <span>100+ Active Users</span>
                </StatItem>
                <StatItem>
                  <span>⚡</span>
                  <span>10k+ Videos Summarized</span>
                </StatItem>
              </HeroBottomStats>
              <HeroBottomButtons
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
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
              </HeroBottomButtons>
            </HeroBottomSection>
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

      <TutorialSection>
        <Container>
          <TutorialTitle>See ClickSummary in Action</TutorialTitle>
          <TutorialSubtitle>
            Watch our quick demo tutorial to learn how to get the most out of ClickSummary's powerful features.
          </TutorialSubtitle>
          <VideoContainer
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <VideoWrapper>
              <iframe
                src={`https://www.youtube.com/embed/${TUTORIAL_VIDEO_ID}?rel=0&modestbranding=1`}
                title="ClickSummary Demo Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </VideoWrapper>
          </VideoContainer>
        </Container>
      </TutorialSection>

      <SocialProofSection>
        <Container>
          <SectionTitle>Loved by Students, Professionals & Researchers</SectionTitle>
          <TestimonialsGrid>
            <TestimonialCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <StarsRating>⭐⭐⭐⭐⭐</StarsRating>
              <TestimonialText>
                "ClickSummary has been a game-changer for my research. I can now review 20+ educational videos in the time it used to take me to watch 2. The AI summaries are incredibly accurate!"
              </TestimonialText>
              <TestimonialAuthor>
                <AuthorAvatar>SM</AuthorAvatar>
                <AuthorInfo>
                  <AuthorName>Sarah Mitchell</AuthorName>
                  <AuthorRole>PhD Student</AuthorRole>
                </AuthorInfo>
              </TestimonialAuthor>
            </TestimonialCard>

            <TestimonialCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <StarsRating>⭐⭐⭐⭐⭐</StarsRating>
              <TestimonialText>
                "As a content creator, I need to stay on top of trends. ClickSummary lets me scan through hours of competitor content in minutes. Absolute must-have tool!"
              </TestimonialText>
              <TestimonialAuthor>
                <AuthorAvatar>RK</AuthorAvatar>
                <AuthorInfo>
                  <AuthorName>Raj Kumar</AuthorName>
                  <AuthorRole>YouTube Creator</AuthorRole>
                </AuthorInfo>
              </TestimonialAuthor>
            </TestimonialCard>

            <TestimonialCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <StarsRating>⭐⭐⭐⭐⭐</StarsRating>
              <TestimonialText>
                "I was skeptical at first, but the interactive chat feature is mind-blowing. It's like having a personal tutor who's watched every video for you. Worth every penny!"
              </TestimonialText>
              <TestimonialAuthor>
                <AuthorAvatar>JL</AuthorAvatar>
                <AuthorInfo>
                  <AuthorName>Jennifer Lee</AuthorName>
                  <AuthorRole>Software Engineer</AuthorRole>
                </AuthorInfo>
              </TestimonialAuthor>
            </TestimonialCard>
          </TestimonialsGrid>
        </Container>
      </SocialProofSection>

      <ComparisonSection>
        <Container>
          <SectionTitle>The Old Way vs. The ClickSummary Way</SectionTitle>
          <ComparisonGrid>
            <ComparisonCard
              $type="before"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <ComparisonLabel $type="before">Without ClickSummary</ComparisonLabel>
              <ComparisonTitle>Slow & Inefficient</ComparisonTitle>
              <ComparisonList>
                <ComparisonItem $type="before">Watch entire 45-minute videos to find key points</ComparisonItem>
                <ComparisonItem $type="before">Take manual notes and miss important details</ComparisonItem>
                <ComparisonItem $type="before">Rewatch videos multiple times to understand</ComparisonItem>
                <ComparisonItem $type="before">Waste 20+ hours per week on video content</ComparisonItem>
                <ComparisonItem $type="before">No way to quickly search or reference content</ComparisonItem>
              </ComparisonList>
            </ComparisonCard>

            <ComparisonCard
              $type="after"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <ComparisonLabel $type="after">With ClickSummary</ComparisonLabel>
              <ComparisonTitle>Fast & Smart</ComparisonTitle>
              <ComparisonList>
                <ComparisonItem $type="after">Get comprehensive summaries in 10 seconds</ComparisonItem>
                <ComparisonItem $type="after">AI captures all key insights automatically</ComparisonItem>
                <ComparisonItem $type="after">Ask questions and get instant answers</ComparisonItem>
                <ComparisonItem $type="after">Save 20+ hours per week for what matters</ComparisonItem>
                <ComparisonItem $type="after">Export and organize all your summaries</ComparisonItem>
              </ComparisonList>
            </ComparisonCard>
          </ComparisonGrid>
        </Container>
      </ComparisonSection>

      <ShowcaseSection>
        <Container>
          <SectionTitle>Powerful Features at Your Fingertips</SectionTitle>
          <ShowcaseGrid>
            <ShowcaseCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <ShowcaseImageContainer>
                <ShowcaseImage src="/extension-summary-panel.png" alt="Summary Generation Options" />
              </ShowcaseImageContainer>
              <ShowcaseContent>
                <ShowcaseTitle>
                  <ShowcaseIcon>📝</ShowcaseIcon>
                  Customizable Summaries
                </ShowcaseTitle>
                <ShowcaseDescription>
                  Tailor your video summaries to your exact needs with flexible options for summary type, format, and length.
                </ShowcaseDescription>
                <ShowcaseFeatureList>
                  <ShowcaseFeatureItem>Choose from multiple summary types (Insightful, Quick, Detailed)</ShowcaseFeatureItem>
                  <ShowcaseFeatureItem>Select your preferred format (List, Paragraph, Bullet Points)</ShowcaseFeatureItem>
                  <ShowcaseFeatureItem>Adjust length to Short, Medium, or Long</ShowcaseFeatureItem>
                  <ShowcaseFeatureItem>Access full video transcripts instantly</ShowcaseFeatureItem>
                  <ShowcaseFeatureItem>Export summaries in multiple formats</ShowcaseFeatureItem>
                </ShowcaseFeatureList>
              </ShowcaseContent>
            </ShowcaseCard>

            <ShowcaseCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <ShowcaseImageContainer>
                <ShowcaseImage src="/extension-chat-panel.png" alt="Interactive Chat Feature" />
              </ShowcaseImageContainer>
              <ShowcaseContent>
                <ShowcaseTitle>
                  <ShowcaseIcon>💬</ShowcaseIcon>
                  AI-Powered Chat
                </ShowcaseTitle>
                <ShowcaseDescription>
                  Have a conversation with the video content. Ask questions and get instant, context-aware answers based on the transcript.
                </ShowcaseDescription>
                <ShowcaseFeatureList>
                  <ShowcaseFeatureItem>Ask any question about the video content</ShowcaseFeatureItem>
                  <ShowcaseFeatureItem>Get accurate answers based on the transcript</ShowcaseFeatureItem>
                  <ShowcaseFeatureItem>Explore topics in depth with follow-up questions</ShowcaseFeatureItem>
                  <ShowcaseFeatureItem>Save time by finding specific information quickly</ShowcaseFeatureItem>
                  <ShowcaseFeatureItem>Perfect for research and learning</ShowcaseFeatureItem>
                </ShowcaseFeatureList>
              </ShowcaseContent>
            </ShowcaseCard>

            <ShowcaseCard
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <ShowcaseContent style={{ paddingTop: '48px' }}>
                <ShowcaseTitle>
                  <ShowcaseIcon>🚀</ShowcaseIcon>
                  Seamless Workflow
                </ShowcaseTitle>
                <ShowcaseDescription>
                  Integrate ClickSummary into your daily workflow with our intuitive Chrome extension. Access all features directly on YouTube.
                </ShowcaseDescription>
                <ShowcaseFeatureList>
                  <ShowcaseFeatureItem>One-click activation on any YouTube video</ShowcaseFeatureItem>
                  <ShowcaseFeatureItem>Clean, modern interface that doesn't distract</ShowcaseFeatureItem>
                  <ShowcaseFeatureItem>Toggle between summary and chat modes instantly</ShowcaseFeatureItem>
                  <ShowcaseFeatureItem>Works on all YouTube videos with transcripts</ShowcaseFeatureItem>
                  <ShowcaseFeatureItem>Sync your summaries across devices</ShowcaseFeatureItem>
                </ShowcaseFeatureList>
              </ShowcaseContent>
              <ShowcaseImageContainer style={{ height: '280px', marginTop: '24px' }}>
                <div style={{ 
                  color: 'white', 
                  fontSize: '4rem', 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div>⚡</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>Lightning Fast</div>
                </div>
              </ShowcaseImageContainer>
            </ShowcaseCard>
          </ShowcaseGrid>
        </Container>
      </ShowcaseSection>

      <FAQSection>
        <Container>
          <SectionTitle>Frequently Asked Questions</SectionTitle>
          <FAQGrid>
            <FAQItem
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <FAQQuestion>How accurate are the AI summaries?</FAQQuestion>
              <FAQAnswer>
                Our AI achieves 95%+ accuracy by analyzing full video transcripts. It captures key points, main ideas, and important details that matter most. Thousands of users trust ClickSummary for research, learning, and professional work.
              </FAQAnswer>
            </FAQItem>

            <FAQItem
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <FAQQuestion>Does it work on all YouTube videos?</FAQQuestion>
              <FAQAnswer>
                ClickSummary works on any YouTube video that has captions or transcripts available (which is 95%+ of videos). This includes educational content, tutorials, podcasts, lectures, and more.
              </FAQAnswer>
            </FAQItem>

            <FAQItem
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <FAQQuestion>Can I try it before paying?</FAQQuestion>
              <FAQAnswer>
                Absolutely! Start with our Free plan that gives you 5 summaries per day. No credit card required. Upgrade to Premium only when you're ready for unlimited summaries and advanced features.
              </FAQAnswer>
            </FAQItem>

            <FAQItem
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <FAQQuestion>What if I'm not satisfied?</FAQQuestion>
              <FAQAnswer>
                We offer a 7-day money-back guarantee on all Premium plans. If you're not completely satisfied, just email us and we'll refund you immediately, no questions asked.
              </FAQAnswer>
            </FAQItem>

            <FAQItem
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <FAQQuestion>How is this different from just reading the description?</FAQQuestion>
              <FAQAnswer>
                Video descriptions are written by creators and often miss key content. ClickSummary analyzes the actual video transcript to extract insights, key points, and actionable information. Plus, you can ask questions and get instant answers about specific topics.
              </FAQAnswer>
            </FAQItem>
          </FAQGrid>
        </Container>
      </FAQSection>

      <FinalCTASection>
        <Container>
          <FinalCTATitle>Ready to 10x Your Learning Speed?</FinalCTATitle>
          <FinalCTASubtitle>
            Join 100+ users who are saving hours every week. Start free today - no credit card required.
          </FinalCTASubtitle>
          <CTAButtons
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {!isAuthenticated ? (
              <>
                <PrimaryButton href="/pricing">Start Free Trial</PrimaryButton>
                <SecondaryButton href="/signin">Sign In</SecondaryButton>
              </>
            ) : (
              <>
                <PrimaryButton href="/pricing">Upgrade to Premium</PrimaryButton>
                <SecondaryButtonAsButton onClick={redirectToExtension}>
                  Add to Chrome
                </SecondaryButtonAsButton>
              </>
            )}
          </CTAButtons>
          <TrustBadges>
            <TrustBadge>
              <span>🔒</span>
              <span>Secure & Private</span>
            </TrustBadge>
            <TrustBadge>
              <span>💰</span>
              <span>7-Day Money Back</span>
            </TrustBadge>
            <TrustBadge>
              <span>⚡</span>
              <span>Instant Setup</span>
            </TrustBadge>
            <TrustBadge>
              <span>🎯</span>
              <span>Cancel Anytime</span>
            </TrustBadge>
          </TrustBadges>
        </Container>
      </FinalCTASection>
    </PageContainer>
  );
}
