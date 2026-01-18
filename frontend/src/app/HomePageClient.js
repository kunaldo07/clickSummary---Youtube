'use client'

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import Link from 'next/link';

// --- Animations ---
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const gradientText = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// --- Styled Components ---

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 72px;
  background: #fff;
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
`;

const GradientBg = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80vh;
  background: radial-gradient(circle at 50% -20%, rgba(99, 102, 241, 0.1), transparent 60%);
  pointer-events: none;
  z-index: 0;
`;

const HeroSection = styled.section`
  padding: 100px 24px 60px;
  text-align: center;
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
`;

const HeroTitle = styled(motion.h1)`
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: #111827;
  margin-bottom: 24px;

  span {
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${gradientText} 4s linear infinite;
  }

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.25rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto 48px;
  line-height: 1.6;
`;

// --- Bento Grid ---

const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 320px);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto 100px;
  padding: 0 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const BentoCard = styled(motion.div)`
  background: white;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  text-decoration: none;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-color: rgba(99, 102, 241, 0.3);
  }
`;

// Specialized Card Sizes
const LargeCard = styled(BentoCard)`
  grid-column: span 2;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);

  @media (max-width: 768px) {
    grid-column: span 1;
    min-height: 400px;
  }
`;

const MediumCard = styled(BentoCard)`
  grid-column: span 1;
  background: white;
`;

const SmallCard = styled(BentoCard)`
  grid-column: span 1;
  height: 320px;
  background: #f9fafb;
`;

// Card Content Styles
const CardContent = styled.div`
  padding: 32px;
  display: flex;
  flex-direction: column;
  height: 100%;
  z-index: 2;
`;

const CardTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 16px;
  width: fit-content;
  
  &.youtube { background: #fee2e2; color: #ef4444; }
  &.reddit { background: #ffedd5; color: #f97316; }
  &.soon { background: #f3f4f6; color: #6b7280; }
`;

const CardTitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
`;

const CardDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 24px;
`;

const CardAction = styled.div`
  margin-top: auto;
  font-weight: 600;
  color: #6366f1;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: gap 0.2s;

  ${BentoCard}:hover & {
    gap: 10px;
  }
`;

// Card Visuals
const CardVisual = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 60%;
  z-index: 1;
  overflow: hidden;
`;

// YouTube Visual
const YouTubeMockup = styled.div`
  position: absolute;
  bottom: -20px;
  right: -20px;
  width: 80%;
  height: 120%;
  background: white;
  border-radius: 12px;
  box-shadow: -10px -10px 40px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transform: rotate(-3deg);
  transition: transform 0.3s ease;

  ${BentoCard}:hover & {
    transform: rotate(-1deg) translateY(-5px);
  }
`;

const MockLine = styled.div`
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  width: ${props => props.width || '100%'};
`;

// Reddit Visual
const RedditMockup = styled.div`
  position: absolute;
  bottom: -40px;
  right: -40px;
  width: 90%;
  background: white;
  border-radius: 12px;
  box-shadow: -10px -10px 30px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
  padding: 20px;
  transform: rotate(3deg);
  transition: transform 0.3s ease;

  ${BentoCard}:hover & {
    transform: rotate(1deg) translateY(-5px);
  }
`;

const RedditHeader = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
`;

const RedditAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #FF4500;
`;

// Coming Soon Visual
const BlurIcon = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  font-size: 80px;
  opacity: 0.1;
  filter: blur(2px);
  transform: rotate(-10deg);
`;

const EcosystemSection = styled.section`
  background: #111827;
  color: white;
  padding: 100px 24px;
  text-align: center;
`;

const EcosystemTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 24px;
`;

const EcosystemSubtitle = styled.p`
  font-size: 1.25rem;
  color: #9ca3af;
  max-width: 600px;
  margin: 0 auto 48px;
`;

const FeatureList = styled.div`
  display: flex;
  justify-content: center;
  gap: 48px;
  flex-wrap: wrap;
`;

const FeatureItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const FeatureIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const FeatureText = styled.span`
  font-weight: 600;
  color: #e5e7eb;
`;

export default function HomePageClient() {
  return (
    <PageContainer>
      <GradientBg />
      
      <HeroSection>
        <HeroTitle
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Your AI Copilot for the <span>Entire Web</span>
        </HeroTitle>
        <HeroSubtitle
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          One subscription. Infinite insights. Summarize videos, analyze discussions, and extract knowledge from your favorite platforms instantly.
        </HeroSubtitle>
      </HeroSection>

      <BentoGrid>
        {/* YouTube - Flagship Product */}
        <Link href="/youtube" passHref style={{ textDecoration: 'none', gridColumn: 'span 2' }}>
          <LargeCard
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <CardContent>
              <CardTag className="youtube">Most Popular</CardTag>
              <CardTitle>YouTube Summarizer</CardTitle>
              <CardDescription>
                Turn 45-minute videos into 30-second insights. Chat with videos, search transcripts, and learn 10x faster.
              </CardDescription>
              <CardAction>Explore YouTube AI →</CardAction>
            </CardContent>
            <CardVisual>
              <YouTubeMockup>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#111' }}>AI Summary</div>
                  <div style={{ fontSize: '12px', color: '#6366f1' }}>ClickSummary</div>
                </div>
                <MockLine width="90%" style={{ background: '#e0e7ff' }} />
                <MockLine width="85%" style={{ background: '#e0e7ff' }} />
                <MockLine width="40%" style={{ background: '#e0e7ff' }} />
                <div style={{ marginTop: 'auto', padding: '10px', background: '#f3f4f6', borderRadius: '8px', fontSize: '12px', color: '#666' }}>
                  Key Insight: AI agents are evolving...
                </div>
              </YouTubeMockup>
            </CardVisual>
          </LargeCard>
        </Link>

        {/* Reddit Product */}
        <Link href="/reddit" passHref style={{ textDecoration: 'none' }}>
          <MediumCard
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <CardContent>
              <CardTag className="reddit">New Release</CardTag>
              <CardTitle>Reddit Analyzer</CardTitle>
              <CardDescription>
                Skip the scrolling. Summarize threads, spot controversies, and get community consensus instantly.
              </CardDescription>
              <CardAction>Explore Reddit AI →</CardAction>
            </CardContent>
            <CardVisual>
              <RedditMockup>
                <RedditHeader>
                  <RedditAvatar />
                  <div style={{ height: '12px', width: '60px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                </RedditHeader>
                <MockLine width="100%" style={{ marginBottom: '8px' }} />
                <MockLine width="80%" />
                <div style={{ marginTop: '20px', padding: '8px', background: '#fff0e5', borderRadius: '6px', color: '#c2410c', fontSize: '11px', fontWeight: 'bold' }}>
                  🔥 Trending Topic
                </div>
              </RedditMockup>
            </CardVisual>
          </MediumCard>
        </Link>

        {/* PDF Summarizer (Coming Soon) */}
        <SmallCard>
          <CardContent style={{ opacity: 0.6 }}>
            <CardTag className="soon">Waitlist</CardTag>
            <CardTitle>PDF & Article AI</CardTitle>
            <CardDescription>
              Upload documents or paste URLs to get instant summaries and ask questions.
            </CardDescription>
            <CardAction style={{ color: '#6b7280' }}>Coming Soon...</CardAction>
          </CardContent>
          <BlurIcon>📄</BlurIcon>
        </SmallCard>

        {/* Twitter/X Analyzer (Coming Soon) */}
        <SmallCard>
          <CardContent style={{ opacity: 0.6 }}>
            <CardTag className="soon">Waitlist</CardTag>
            <CardTitle>X (Twitter) Analyst</CardTitle>
            <CardDescription>
              Analyze viral threads, profiles, and trending topics with one click.
            </CardDescription>
            <CardAction style={{ color: '#6b7280' }}>Coming Soon...</CardAction>
          </CardContent>
          <BlurIcon>🐦</BlurIcon>
        </SmallCard>

        {/* Unified Account Promo */}
        <MediumCard style={{ background: '#111827', color: 'white', gridColumn: 'span 1' }}>
          <CardContent>
            <CardTag style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>One Account</CardTag>
            <CardTitle style={{ color: 'white' }}>Unified Access</CardTitle>
            <CardDescription style={{ color: '#9ca3af' }}>
              One ClickSummary subscription unlocks all current and future extensions.
            </CardDescription>
            <Link href="/pricing" style={{ color: 'white', textDecoration: 'underline', marginTop: 'auto' }}>
              View Pricing →
            </Link>
          </CardContent>
        </MediumCard>
      </BentoGrid>

      <EcosystemSection>
        <EcosystemTitle>Built for your workflow</EcosystemTitle>
        <EcosystemSubtitle>
          Seamlessly integrated into the browsers and platforms you use every day.
        </EcosystemSubtitle>
        <FeatureList>
          <FeatureItem>
            <FeatureIcon>⚡</FeatureIcon>
            <FeatureText>Instant Setup</FeatureText>
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>🔒</FeatureIcon>
            <FeatureText>Secure & Private</FeatureText>
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>☁️</FeatureIcon>
            <FeatureText>Cloud Sync</FeatureText>
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>📱</FeatureIcon>
            <FeatureText>Cross-Platform</FeatureText>
          </FeatureItem>
        </FeatureList>
      </EcosystemSection>
    </PageContainer>
  );
}
