'use client'

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, useAnimation, useInView } from 'framer-motion';
import Link from 'next/link';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 72px;
  background: linear-gradient(135deg, #FF4500 0%, #FF8717 100%);
  position: relative;
  overflow: hidden;
`;

const BackgroundPattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="1.5" fill="rgba(255,255,255,0.05)"/><circle cx="40" cy="60" r="0.8" fill="rgba(255,255,255,0.08)"/><circle cx="70" cy="30" r="1.2" fill="rgba(255,255,255,0.06)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
`;

const FloatingElements = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  
  &::before {
    content: '🤖';
    position: absolute;
    top: 15%;
    left: 10%;
    font-size: 60px;
    animation: float1 6s ease-in-out infinite;
    opacity: 0.3;
  }
  
  &::after {
    content: '📊';
    position: absolute;
    bottom: 20%;
    right: 15%;
    font-size: 80px;
    animation: float2 8s ease-in-out infinite;
    opacity: 0.3;
  }
  
  @keyframes float1 {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(10deg); }
  }
  
  @keyframes float2 {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(15px) rotate(-10deg); }
  }
`;

const HeroSection = styled.section`
  padding: 100px 24px 80px;
  text-align: center;
  position: relative;
  z-index: 1;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const ComingSoonBadge = styled(motion.span)`
  display: inline-block;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #1f2937;
  padding: 8px 20px;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
`;

const HeroTitle = styled(motion.h1)`
  font-size: 4rem;
  font-weight: 900;
  color: white;
  margin-bottom: 24px;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  line-height: 1.1;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.95);
  max-width: 700px;
  margin: 0 auto 40px;
  line-height: 1.6;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const StatsBar = styled(motion.div)`
  display: flex;
  justify-content: center;
  gap: 48px;
  margin: 48px auto;
  flex-wrap: wrap;
`;

const StatItem = styled(motion.div)`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: 900;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 8px;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CTAButton = styled(motion.a)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: white;
  color: #FF4500;
  padding: 20px 48px;
  border-radius: 50px;
  font-size: 1.375rem;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  cursor: pointer;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }
`;

const UrgencyText = styled(motion.div)`
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const PulsingDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }
`;

const FeaturesSection = styled.section`
  padding: 80px 24px;
  background: white;
  position: relative;
  z-index: 1;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 24px;
  color: #1f2937;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  text-align: center;
  max-width: 600px;
  margin: 0 auto 64px;
  line-height: 1.6;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const FeatureCard = styled(motion.div)`
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid rgba(255, 69, 0, 0.1);
  position: relative;
  overflow: hidden;
  cursor: pointer;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 69, 0, 0.1) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  &:hover::before {
    opacity: 1;
  }
`;

const FeatureIcon = styled(motion.div)`
  font-size: 3.5rem;
  margin-bottom: 24px;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
`;

const FeatureDescription = styled.p`
  color: #6b7280;
  line-height: 1.7;
  font-size: 1rem;
`;

const SocialProofSection = styled.section`
  padding: 60px 24px;
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  position: relative;
  z-index: 1;
`;

const TestimonialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const TestimonialCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #FF4500;
`;

const TestimonialText = styled.p`
  color: #374151;
  line-height: 1.7;
  font-size: 1rem;
  margin-bottom: 20px;
  font-style: italic;
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
  background: linear-gradient(135deg, #FF4500 0%, #FF8717 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.div`
  font-weight: 700;
  color: #1f2937;
`;

const AuthorRole = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const UseCasesSection = styled.section`
  padding: 80px 24px;
  background: white;
  position: relative;
  z-index: 1;
`;

const UseCasesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
`;

const UseCaseCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #FF4500;
  position: relative;
  overflow: hidden;
`;

const UseCaseIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 16px;
`;

const UseCaseTitle = styled.h4`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
`;

const UseCaseDescription = styled.p`
  color: #6b7280;
  line-height: 1.6;
  font-size: 0.95rem;
`;

const CTASection = styled.section`
  padding: 100px 24px;
  background: linear-gradient(135deg, #FF4500 0%, #FF8717 100%);
  position: relative;
  z-index: 1;
  text-align: center;
  overflow: hidden;
`;

const CTAGlow = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

const CTATitle = styled.h2`
  font-size: 3rem;
  font-weight: 900;
  color: white;
  margin-bottom: 24px;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const CTADescription = styled.p`
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.95);
  max-width: 600px;
  margin: 0 auto 40px;
  line-height: 1.6;
  position: relative;
  z-index: 1;
`;

const NotifyButton = styled(motion.button)`
  background: white;
  color: #FF4500;
  padding: 20px 48px;
  border-radius: 50px;
  font-size: 1.25rem;
  font-weight: 800;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 69, 0, 0.1);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  &:hover::before {
    width: 300px;
    height: 300px;
  }
`;

const WaitlistCount = styled(motion.div)`
  margin-top: 32px;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  z-index: 1;
`;

const CountBadge = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 16px;
  border-radius: 20px;
  font-weight: 700;
  backdrop-filter: blur(10px);
`;

// Animated Counter Component
const AnimatedCounter = ({ end, duration = 2, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / (duration * 1000);
        
        if (progress < 1) {
          setCount(Math.floor(end * progress));
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, hasAnimated, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

const RedditPageClient = () => {
  const features = [
    {
      icon: '🎯',
      title: 'Instant Post Analysis',
      description: 'Get AI-powered summaries of Reddit posts and comment threads in seconds. No more scrolling through hundreds of comments.'
    },
    {
      icon: '💬',
      title: 'Smart Comment Insights',
      description: 'Identify the most valuable comments, key arguments, and important discussions automatically.'
    },
    {
      icon: '📊',
      title: 'Sentiment Analysis',
      description: 'Understand the overall sentiment and tone of discussions. See what the community really thinks.'
    },
    {
      icon: '🔥',
      title: 'Controversy Detection',
      description: 'Quickly spot controversial topics and heated debates. Know what\'s generating the most discussion.'
    },
    {
      icon: '⚡',
      title: 'One-Click Summaries',
      description: 'Summarize entire subreddit threads with a single click. Save hours of reading time.'
    },
    {
      icon: '🎨',
      title: 'Beautiful UI',
      description: 'Seamlessly integrated into Reddit\'s interface. Clean, modern design that enhances your browsing experience.'
    }
  ];

  const testimonials = [
    {
      text: "Finally! I can keep up with r/programming without spending my entire day scrolling. This is going to be a game-changer.",
      author: "Alex Chen",
      role: "Software Engineer",
      avatar: "👨‍💻"
    },
    {
      text: "As a marketer, understanding Reddit sentiment is crucial. Can't wait for this to launch!",
      author: "Sarah Mitchell",
      role: "Marketing Manager",
      avatar: "👩‍💼"
    },
    {
      text: "Reddit research will never be the same. This is exactly what I've been looking for.",
      author: "Mike Johnson",
      role: "Product Manager",
      avatar: "🧑‍💼"
    }
  ];

  const useCases = [
    {
      icon: '📚',
      title: 'Research & Learning',
      description: 'Quickly extract key insights from technical subreddits and educational discussions.'
    },
    {
      icon: '💼',
      title: 'Market Research',
      description: 'Analyze customer sentiment and gather feedback from product-related subreddits.'
    },
    {
      icon: '🔍',
      title: 'Due Diligence',
      description: 'Research topics thoroughly by understanding the consensus and key points from communities.'
    },
    {
      icon: '🗣️',
      title: 'Community Management',
      description: 'Stay on top of discussions and quickly understand community concerns and feedback.'
    }
  ];

  return (
    <PageContainer>
      <BackgroundPattern />
      <FloatingElements />

      <HeroSection>
        <Container>
          <ComingSoonBadge
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.05 }}
          >
            🚀 Coming Soon
          </ComingSoonBadge>
          
          <HeroTitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Reddit Post Analyzer
          </HeroTitle>
          
          <HeroSubtitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Stop wasting hours scrolling. Get AI-powered insights from any Reddit discussion in seconds.
          </HeroSubtitle>

          <StatsBar
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <StatItem
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <StatNumber><AnimatedCounter end={10} suffix="k+" /></StatNumber>
              <StatLabel>Users Waiting</StatLabel>
            </StatItem>
            <StatItem
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <StatNumber><AnimatedCounter end={95} suffix="%" /></StatNumber>
              <StatLabel>Time Saved</StatLabel>
            </StatItem>
            <StatItem
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <StatNumber><AnimatedCounter end={5} suffix="s" /></StatNumber>
              <StatLabel>Average Analysis</StatLabel>
            </StatItem>
          </StatsBar>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <CTAButton
              href="#notify"
              whileHover={{ scale: 1.05, boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span>🔔</span>
              <span>Join the Waitlist Now</span>
            </CTAButton>
            
            <UrgencyText
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <PulsingDot />
              <span><strong>247 people</strong> joined in the last 24 hours</span>
            </UrgencyText>
          </motion.div>
        </Container>
      </HeroSection>

      <FeaturesSection>
        <Container>
          <SectionTitle>Powerful Features for Smarter Reddit Browsing</SectionTitle>
          <SectionSubtitle>
            Everything you need to analyze Reddit discussions efficiently and extract meaningful insights.
          </SectionSubtitle>
          <FeaturesGrid>
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  y: -8, 
                  boxShadow: "0 20px 40px rgba(255, 69, 0, 0.2)",
                  borderColor: "rgba(255, 69, 0, 0.4)"
                }}
              >
                <FeatureIcon
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {feature.icon}
                </FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeaturesGrid>
        </Container>
      </FeaturesSection>

      <SocialProofSection>
        <Container>
          <SectionTitle>What Early Users Are Saying</SectionTitle>
          <SectionSubtitle>
            Join thousands of professionals who can't wait to transform their Reddit experience.
          </SectionSubtitle>
          <TestimonialGrid>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)" }}
              >
                <TestimonialText>"{testimonial.text}"</TestimonialText>
                <TestimonialAuthor>
                  <AuthorAvatar>{testimonial.avatar}</AuthorAvatar>
                  <AuthorInfo>
                    <AuthorName>{testimonial.author}</AuthorName>
                    <AuthorRole>{testimonial.role}</AuthorRole>
                  </AuthorInfo>
                </TestimonialAuthor>
              </TestimonialCard>
            ))}
          </TestimonialGrid>
        </Container>
      </SocialProofSection>

      <UseCasesSection>
        <Container>
          <SectionTitle>Perfect For</SectionTitle>
          <SectionSubtitle>
            Whether you're researching, learning, or managing communities, our Reddit analyzer saves you time.
          </SectionSubtitle>
          <UseCasesList>
            {useCases.map((useCase, index) => (
              <UseCaseCard
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  x: 8,
                  boxShadow: "0 12px 32px rgba(255, 69, 0, 0.15)"
                }}
              >
                <UseCaseIcon>{useCase.icon}</UseCaseIcon>
                <UseCaseTitle>{useCase.title}</UseCaseTitle>
                <UseCaseDescription>{useCase.description}</UseCaseDescription>
              </UseCaseCard>
            ))}
          </UseCasesList>
        </Container>
      </UseCasesSection>

      <CTASection id="notify">
        <CTAGlow
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <Container>
          <CTATitle>Be the First to Know</CTATitle>
          <CTADescription>
            Join our exclusive waitlist and get early access to the Reddit Post Analyzer. Limited spots available for beta testers!
          </CTADescription>
          <Link href="/signin" passHref legacyBehavior>
            <NotifyButton
              as="a"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              🚀 Join the Waitlist - It's Free
            </NotifyButton>
          </Link>
          
          <WaitlistCount
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <span>🔥</span>
            <CountBadge><AnimatedCounter end={10247} /></CountBadge>
            <span>developers already on the waitlist</span>
          </WaitlistCount>
          
          <div style={{ marginTop: '32px', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', position: 'relative', zIndex: 1 }}>
            💡 Already a ClickSummary user? You'll get <strong>automatic priority access</strong> when we launch!
          </div>
        </Container>
      </CTASection>
    </PageContainer>
  );
};

export default RedditPageClient;
