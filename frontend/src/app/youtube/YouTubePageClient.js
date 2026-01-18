'use client'

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import config from '../../lib/environment';
import { redirectToExtension } from '../../utils/extensionHelpers';

// --- Animations ---
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const shine = keyframes`
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
`;

// --- Styled Components ---

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 72px;
  background: #fff;
  overflow-x: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const GradientBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  background: radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15), transparent 70%),
              radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1), transparent 50%);
  pointer-events: none;
  z-index: 0;
`;

const HeroSection = styled.section`
  padding: 80px 24px 120px;
  text-align: center;
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
`;

const Badge = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
  border-radius: 100px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 32px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  cursor: pointer;
  
  &:hover {
    background: rgba(99, 102, 241, 0.12);
  }
`;

const HeroTitle = styled(motion.h1)`
  font-size: 4.5rem;
  font-weight: 800;
  color: #1a1a1b;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #1a1a1b 0%, #4a4a4b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 2.75rem;
  }
`;

const Highlight = styled.span`
  color: #6366f1;
  -webkit-text-fill-color: #6366f1;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 8px;
    left: 0;
    width: 100%;
    height: 12px;
    background: rgba(99, 102, 241, 0.15);
    z-index: -1;
    transform: rotate(-1deg);
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.25rem;
  color: #5f6368;
  max-width: 640px;
  margin: 0 auto 48px;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const CTAContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const MainButton = styled(motion.a)`
  background: #6366f1;
  color: white;
  padding: 18px 40px;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 700;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.25);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(99, 102, 241, 0.35);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    background-size: 200% 100%;
    animation: ${shine} 3s infinite linear;
  }
`;

const SecondaryButton = styled(Link)`
  background: white;
  color: #374151;
  padding: 18px 40px;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    transform: translateY(-2px);
  }
`;

const SubText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
`;

// --- Browser Mockup Component ---
const BrowserMockup = styled(motion.div)`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 24px 60px -12px rgba(50, 50, 93, 0.25), 
              0 12px 36px -8px rgba(0, 0, 0, 0.15);
  max-width: 1000px;
  margin: 80px auto 0;
  border: 1px solid #e1e4e8;
  position: relative;
  overflow: hidden;
`;

const BrowserHeader = styled.div`
  background: #f1f3f4;
  padding: 12px 16px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #e1e4e8;
`;

const Dot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const BrowserContent = styled.div`
  padding: 0;
  position: relative;
  background: #f9f9f9; /* YouTube-ish bg */
  min-height: 500px;
`;

// Mock YouTube UI
const MockYouTubePlayer = styled.div`
  background: #000;
  width: 100%;
  height: 360px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
`;

const MockVideoInfo = styled.div`
  padding: 20px;
  background: white;
`;

const MockVideoTitle = styled.div`
  height: 24px;
  width: 60%;
  background: #e5e7eb;
  border-radius: 4px;
  margin-bottom: 12px;
`;

const MockVideoMeta = styled.div`
  height: 16px;
  width: 40%;
  background: #f3f4f6;
  border-radius: 4px;
`;

const ExtensionOverlay = styled(motion.div)`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  border: 1px solid #e1e4e8;
  z-index: 10;
  overflow: hidden;
  height: 460px;
`;

const OverlayHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  background: white;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OverlayContent = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SummaryPoint = styled(motion.div)`
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #6366f1;
  font-size: 13px;
  line-height: 1.5;
  color: #374151;
`;

// --- Features Grid ---
const FeaturesSection = styled.section`
  padding: 100px 24px;
  background: #fafafa;
`;

const SectionHeader = styled.div`
  text-align: center;
  max-width: 700px;
  margin: 0 auto 60px;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  color: #1a1a1b;
  margin-bottom: 16px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Card = styled(motion.div)`
  background: white;
  padding: 32px;
  border-radius: 16px;
  border: 1px solid #eee;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.08);
    border-color: rgba(99, 102, 241, 0.2);
  }
`;

const IconWrapper = styled.div`
  width: 50px;
  height: 50px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #6366f1;
  margin-bottom: 20px;
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1a1a1b;
`;

const CardText = styled.p`
  color: #666;
  line-height: 1.6;
`;

// --- Social Proof ---
const ProofSection = styled.section`
  padding: 60px 24px;
  background: white;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
`;

const StatBlock = styled.div`
  text-align: center;
`;

const StatVal = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #1a1a1b;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export default function YouTubePageClient() {
  const { isAuthenticated } = useAuth();
  const heroRef = useRef(null);

  return (
    <PageContainer>
      <GradientBackground />
      
      <HeroSection ref={heroRef}>
        <Badge
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span style={{ fontSize: '1.2rem' }}>✨</span>
          <span>New: Interactive Transcript Search</span>
        </Badge>

        <HeroTitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Watch Videos <Highlight>10x Faster</Highlight>
          <br />with AI Summaries
        </HeroTitle>

        <HeroSubtitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Get instant AI summaries, ask questions, and search transcripts for any YouTube video. 
          Stop wasting hours watching content you don't need.
        </HeroSubtitle>

        <CTAContainer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {!isAuthenticated ? (
              <>
                <MainButton href="/pricing">
                  <span>Start Free Trial</span>
                  <span style={{ fontSize: '1.2rem' }}>→</span>
                </MainButton>
              </>
            ) : (
              <MainButton onClick={redirectToExtension}>
                <span>Add to Chrome</span>
                <span style={{ fontSize: '1.2rem' }}>→</span>
              </MainButton>
            )}
          </div>
          <SubText>
            <span>✓ No credit card required</span>
            <span>•</span>
            <span>✓ 4.9/5 Chrome Store rating</span>
          </SubText>
        </CTAContainer>

        {/* Animated Browser Mockup */}
        <BrowserMockup
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
        >
          <BrowserHeader>
            <Dot color="#FF5F56" />
            <Dot color="#FFBD2E" />
            <Dot color="#27C93F" />
            <div style={{ 
              background: '#fff', 
              borderRadius: '4px', 
              fontSize: '12px', 
              padding: '2px 8px', 
              color: '#888',
              marginLeft: '10px',
              flex: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              🔒 youtube.com/watch?v=dQw4w9WgXcQ
            </div>
          </BrowserHeader>
          <BrowserContent>
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ flex: 1 }}>
                <MockYouTubePlayer>
                  ▶️ Video Player
                </MockYouTubePlayer>
                <MockVideoInfo>
                  <MockVideoTitle />
                  <MockVideoMeta />
                </MockVideoInfo>
              </div>
              
              <ExtensionOverlay
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <OverlayHeader>
                  <span style={{ fontSize: '18px' }}>✨</span>
                  <span style={{ fontWeight: 'bold', color: '#6366f1' }}>ClickSummary</span>
                </OverlayHeader>
                <OverlayContent>
                  <SummaryPoint
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.6 }}
                  >
                    <strong>⚡ Quick Summary:</strong> This video explains the future of AI agents and how they will autonomously perform complex tasks.
                  </SummaryPoint>
                  <SummaryPoint
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.2 }}
                  >
                    <strong>🎯 Key Insight:</strong> Agents are moving from simple chatbots to actionable tools that can browse the web and use apps.
                  </SummaryPoint>
                  <SummaryPoint
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.8 }}
                  >
                    <strong>💡 Takeaway:</strong> Developers should focus on building tool-use capabilities rather than just better LLMs.
                  </SummaryPoint>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.4 }}
                    style={{ 
                      marginTop: 'auto', 
                      background: '#f3f4f6', 
                      padding: '12px', 
                      borderRadius: '20px',
                      fontSize: '13px',
                      color: '#6b7280',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    💬 Ask a question about this video...
                  </motion.div>
                </OverlayContent>
              </ExtensionOverlay>
            </div>
          </BrowserContent>
        </BrowserMockup>
      </HeroSection>

      <ProofSection>
        <Grid>
          <StatBlock>
            <StatVal>20k+</StatVal>
            <StatLabel>Hours Saved</StatLabel>
          </StatBlock>
          <StatBlock>
            <StatVal>150k+</StatVal>
            <StatLabel>Videos Summarized</StatLabel>
          </StatBlock>
          <StatBlock>
            <StatVal>4.9/5</StatVal>
            <StatLabel>User Rating</StatLabel>
          </StatBlock>
        </Grid>
      </ProofSection>

      <FeaturesSection>
        <SectionHeader>
          <SectionTitle>Everything You Need to Learn Faster</SectionTitle>
          <HeroSubtitle>Powerful features designed for students, researchers, and professionals.</HeroSubtitle>
        </SectionHeader>
        <Grid>
          <Card>
            <IconWrapper>📝</IconWrapper>
            <CardTitle>Instant Summaries</CardTitle>
            <CardText>Get comprehensive summaries in seconds. Choose from bullet points, paragraphs, or detailed breakdowns.</CardText>
          </Card>
          <Card>
            <IconWrapper>💬</IconWrapper>
            <CardTitle>AI Chat Assistant</CardTitle>
            <CardText>Ask questions like "What did they say about pricing?" and get instant answers based on the video content.</CardText>
          </Card>
          <Card>
            <IconWrapper>📜</IconWrapper>
            <CardTitle>Transcript Search</CardTitle>
            <CardText>Search through the video transcript instantly. Click any sentence to jump to that exact moment in the video.</CardText>
          </Card>
          <Card>
            <IconWrapper>🌍</IconWrapper>
            <CardTitle>Multi-Language</CardTitle>
            <CardText>Summarize videos in any language. Translate foreign content instantly to understand global perspectives.</CardText>
          </Card>
        </Grid>
      </FeaturesSection>

      <HeroSection style={{ paddingBottom: '100px', paddingTop: '60px' }}>
        <HeroTitle style={{ fontSize: '2.5rem' }}>Ready to save 20 hours/week?</HeroTitle>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '32px' }}>
          {!isAuthenticated ? (
            <MainButton href="/pricing">
              Get Started for Free
            </MainButton>
          ) : (
            <MainButton onClick={redirectToExtension}>
              Install Chrome Extension
            </MainButton>
          )}
        </div>
      </HeroSection>
    </PageContainer>
  );
}
