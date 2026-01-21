'use client'

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { usePayment } from '../../hooks/usePayment';
import toast from 'react-hot-toast';
import { detectUserCountry, getPricingForCountry, formatPrice } from '../../utils/pricingConfig';

// --- Styled Components ---

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 72px;
  background: #fff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const HeaderSection = styled.section`
  text-align: center;
  padding: 80px 24px 60px;
  max-width: 1000px;
  margin: 0 auto;
`;

const HeaderTitle = styled(motion.h1)`
  font-size: 3.5rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.1;
  margin-bottom: 24px;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Highlight = styled.span`
  color: #6366f1;
`;

const HeaderSubtitle = styled(motion.p)`
  font-size: 1.25rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 32px;
  max-width: 900px;
  margin: 0 auto 100px;
  padding: 0 24px;
`;

const PlanCard = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: 40px;
  border: 1px solid ${props => props.$popular ? '#6366f1' : '#e5e7eb'};
  box-shadow: ${props => props.$popular ? '0 20px 40px -10px rgba(99, 102, 241, 0.15)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)'};
  position: relative;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #6366f1;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
`;

const PlanName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
`;

const PlanDescription = styled.p`
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 24px;
  line-height: 1.5;
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 32px;
`;

const Currency = styled.span`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
`;

const Amount = styled.span`
  font-size: 3.5rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
`;

const Period = styled.span`
  color: #6b7280;
  font-size: 1rem;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 32px 0;
  flex: 1;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: ${props => props.$disabled ? '#9ca3af' : '#374151'};
  
  svg {
    flex-shrink: 0;
    color: ${props => props.$disabled ? '#d1d5db' : '#6366f1'};
  }
`;

const CTAButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$primary ? `
    background: #6366f1;
    color: white;
    border: none;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
    
    &:hover {
      background: #4f46e5;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
    }
  ` : `
    background: white;
    color: #374151;
    border: 1px solid #e5e7eb;
    
    &:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ROIBanner = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  color: #166534;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.5;
`;

const FAQSection = styled.section`
  background: #f9fafb;
  padding: 100px 24px;
`;

const FAQGrid = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  gap: 24px;
`;

const FAQItem = styled.div`
  background: white;
  padding: 32px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
`;

const FAQQuestion = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
`;

const FAQAnswer = styled.p`
  color: #6b7280;
  line-height: 1.6;
`;

export default function PricingPageClient() {
  const { user, isAuthenticated } = useAuth();
  const { subscribeToPremium, loading } = usePayment();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [pricing, setPricing] = useState(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);

  useEffect(() => {
    if (user?.subscription?.plan) {
      setCurrentPlan(user.subscription.plan);
    }
  }, [user]);

  useEffect(() => {
    async function loadPricing() {
      try {
        setIsLoadingPricing(true);
        const detectedCountry = await detectUserCountry();
        const pricingConfig = getPricingForCountry(detectedCountry);
        setPricing(pricingConfig);
      } catch (error) {
        console.error('Error loading pricing:', error);
        const defaultPricing = getPricingForCountry('DEFAULT');
        setPricing(defaultPricing);
      } finally {
        setIsLoadingPricing(false);
      }
    }
    loadPricing();
  }, []);

  const handleSubscribeToPremium = async (planType = 'monthly') => {
    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe');
      // Redirect logic here if needed
      return;
    }
    const result = await subscribeToPremium(planType);
    if (result.success) {
      setCurrentPlan(planType);
    }
  };

  const handleSelectFreePlan = () => {
    if (currentPlan === 'monthly') {
      toast('You can manage your subscription in account settings', { icon: 'ℹ️' });
    } else {
      toast.success('You are already on the Free plan');
    }
  };

  if (isLoadingPricing || !pricing) {
    return (
      <PageContainer>
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#6b7280' }}>Loading pricing...</div>
        </div>
      </PageContainer>
    );
  }

  const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  return (
    <PageContainer>
      <HeaderSection>
        <HeaderTitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Simple pricing, <Highlight>infinite value</Highlight>
        </HeaderTitle>
        <HeaderSubtitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Start for free. Upgrade when you're ready to unlock unlimited AI power.
          Cancel anytime, no questions asked.
        </HeaderSubtitle>
      </HeaderSection>

      <PricingGrid>
        {/* Free Plan */}
        <PlanCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <PlanName>Free Starter</PlanName>
          <PlanDescription>Perfect for trying out ClickSummary</PlanDescription>
          <PriceContainer>
            <Amount>{pricing.currency}0</Amount>
            <Period>/ month</Period>
          </PriceContainer>

          <FeatureList>
            <FeatureItem>
              <CheckIcon />
              <span>5 video summaries per day</span>
            </FeatureItem>
            <FeatureItem>
              <CheckIcon />
              <span>1 AI chat query per day</span>
            </FeatureItem>
            <FeatureItem>
              <CheckIcon />
              <span>Standard processing speed</span>
            </FeatureItem>
            <FeatureItem $disabled>
              <XIcon />
              <span>Unlimited summaries</span>
            </FeatureItem>
            <FeatureItem $disabled>
              <XIcon />
              <span>Transcript search</span>
            </FeatureItem>
          </FeatureList>

          <CTAButton 
            onClick={handleSelectFreePlan}
            disabled={currentPlan === 'free'}
          >
            {currentPlan === 'free' ? 'Current Plan' : 'Start for Free'}
          </CTAButton>
        </PlanCard>

        {/* Premium Plan */}
        <PlanCard
          $popular
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <PopularBadge>Most Popular</PopularBadge>
          <PlanName>Premium Pro</PlanName>
          <PlanDescription>For power users who want to learn faster</PlanDescription>
          
          <PriceContainer>
            <Currency>{pricing.currency}</Currency>
            <Amount>{pricing.monthly}</Amount>
            <Period>/ month</Period>
          </PriceContainer>

          <ROIBanner>
            <span>💰</span>
            <span>
              <strong>Smart Investment:</strong> Save 20+ hours/week. That's less than {pricing.currency}1 per hour saved!
            </span>
          </ROIBanner>

          <FeatureList>
            <FeatureItem>
              <CheckIcon />
              <span><strong>Unlimited</strong> summaries</span>
            </FeatureItem>
            <FeatureItem>
              <CheckIcon />
              <span><strong>Unlimited</strong> AI chat</span>
            </FeatureItem>
            <FeatureItem>
              <CheckIcon />
              <span><strong>Priority</strong> processing speed</span>
            </FeatureItem>
            <FeatureItem>
              <CheckIcon />
              <span>Transcript Search & Export</span>
            </FeatureItem>
            <FeatureItem>
              <CheckIcon />
              <span>Early access to new features</span>
            </FeatureItem>
          </FeatureList>

          <CTAButton 
            $primary 
            onClick={() => handleSubscribeToPremium('monthly')}
            disabled={currentPlan === 'monthly' || loading}
          >
            {loading ? 'Processing...' : (currentPlan === 'monthly' ? 'Current Plan' : 'Upgrade to Pro')}
          </CTAButton>
          
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.85rem', color: '#6b7280' }}>
            7-day money-back guarantee • Cancel anytime
          </div>
        </PlanCard>
      </PricingGrid>

      <FAQSection>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '16px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#6b7280' }}>Everything you need to know about pricing and billing.</p>
        </div>
        
        <FAQGrid>
          <FAQItem>
            <FAQQuestion>Can I cancel my subscription?</FAQQuestion>
            <FAQAnswer>
              Yes, you can cancel anytime from your account settings. You'll keep access to Premium features until the end of your billing period.
            </FAQAnswer>
          </FAQItem>
          <FAQItem>
            <FAQQuestion>How does the 7-day guarantee work?</FAQQuestion>
            <FAQAnswer>
              If you're not 100% satisfied with ClickSummary Premium within the first 7 days, just email us and we'll refund your full payment immediately. No questions asked.
            </FAQAnswer>
          </FAQItem>
          <FAQItem>
            <FAQQuestion>Do you offer student discounts?</FAQQuestion>
            <FAQAnswer>
              Yes! We offer 50% off for students with a valid .edu email address. Contact support to get your discount code.
            </FAQAnswer>
          </FAQItem>
        </FAQGrid>
      </FAQSection>
    </PageContainer>
  );
}
