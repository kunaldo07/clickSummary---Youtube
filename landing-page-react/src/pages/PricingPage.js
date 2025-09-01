import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { usePayment } from '../hooks/usePayment';
import toast from 'react-hot-toast';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 72px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  inset: 0;
  background: radial-gradient(circle at 30% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
  pointer-events: none;
`;

const HeroSection = styled.section`
  padding: 100px 0 80px;
  text-align: center;
  color: white;
  position: relative;
  z-index: 1;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
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
  margin-bottom: 48px;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const PlansSection = styled.section`
  padding: 0 0 100px;
  position: relative;
  z-index: 1;
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  max-width: 700px;
  margin: 0 auto;
`;

const PlanCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 32px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 3px solid transparent;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(139, 92, 246, 0.3);
    box-shadow: 0 16px 64px rgba(139, 92, 246, 0.2);

    &::before {
      opacity: 1;
    }
  }

  ${props => props.$popular && `
    border-color: #8b5cf6;
    transform: scale(1.05);
    
    &:hover {
      transform: scale(1.05) translateY(-8px);
    }
  `}
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  padding: 8px 24px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
`;

const PlanHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
  padding-top: 16px;
`;

const PlanName = styled.h3`
  font-size: 1.5rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 16px;
  letter-spacing: -0.5px;
`;

const PlanPrice = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const PriceAmount = styled.span`
  font-size: 3rem;
  font-weight: 900;
  color: #111827;
  background: linear-gradient(135deg, #1f2937 0%, #4f46e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;

  ${props => props.$popular && `
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  `}
`;

const PricePeriod = styled.span`
  color: #6b7280;
  font-weight: 600;
  margin-top: 8px;
`;

const PlanFeatures = styled.div`
  margin-bottom: 24px;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  ${props => props.$disabled && `opacity: 0.5;`}
`;

const FeatureIcon = styled.span`
  font-size: 1rem;
  min-width: 18px;
`;

const FeatureText = styled.span`
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
`;

const PlanButton = styled(motion.button)`
  width: 100%;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${props => props.$variant === 'free' && `
    background: #f8fafc;
    color: #475569;
    border: 2px solid #e2e8f0;

    &:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      transform: translateY(-2px);
    }
  `}

  ${props => props.$variant === 'premium' && `
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);

    &:hover {
      box-shadow: 0 12px 32px rgba(139, 92, 246, 0.5);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  `}

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  ${props => props.$loading && `
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}
`;

const GuaranteeBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  color: #059669;
  font-size: 0.875rem;
  font-weight: 600;
`;

const SecurityNote = styled.div`
  text-align: center;
  margin-top: 48px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
`;

const PricingPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { subscribeToPremium, loading } = usePayment();
  const [currentPlan, setCurrentPlan] = useState('free');

  useEffect(() => {
    if (user?.subscription?.plan) {
      setCurrentPlan(user.subscription.plan);
    }
  }, [user]);

  const handleSubscribeToPremium = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe');
      return;
    }

    const result = await subscribeToPremium();
    if (result.success) {
      setCurrentPlan('premium');
    }
  };

  const handleSelectFreePlan = () => {
    if (currentPlan === 'premium') {
      toast('You can downgrade to Free plan from your account settings', {
        icon: 'ℹ️'
      });
    } else {
      toast.success('You are already on the Free plan!');
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        { text: '5 summaries per day', enabled: true },
        { text: 'Basic video summaries', enabled: true },
        { text: 'Standard processing time', enabled: true },
        { text: 'Advanced AI insights', enabled: false },
        { text: 'Interactive AI chat', enabled: false },
        { text: 'Export summaries', enabled: false }
      ],
      button: {
        text: currentPlan === 'free' ? 'Current Plan' : 'Select Free',
        variant: 'free',
        disabled: currentPlan === 'free',
        onClick: handleSelectFreePlan
      }
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$10',
      period: 'per month',
      popular: true,
      features: [
        { text: 'Unlimited summaries', enabled: true },
        { text: 'Advanced AI insights', enabled: true },
        { text: 'Interactive AI chat', enabled: true },
        { text: 'Export summaries', enabled: true },
        { text: 'Priority processing', enabled: true },
        { text: 'Custom summary formats', enabled: true }
      ],
      button: {
        text: currentPlan === 'premium' ? 'Current Plan' : 'Upgrade to Premium',
        variant: 'premium',
        disabled: currentPlan === 'premium',
        onClick: handleSubscribeToPremium
      },
      guarantee: true
    }
  ];

  return (
    <PageContainer>
      <BackgroundPattern />
      <FloatingElements />

      <HeroSection>
        <Container>
          <HeroTitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Choose Your Plan
          </HeroTitle>
          <HeroSubtitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Unlock the power of AI-driven video summarization with our secure backend
          </HeroSubtitle>
        </Container>
      </HeroSection>

      <PlansSection>
        <Container>
          <PlansGrid>
            {plans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                $popular={plan.popular}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                {plan.popular && <PopularBadge>Most Popular</PopularBadge>}
                
                <PlanHeader>
                  <PlanName>{plan.name}</PlanName>
                  <PlanPrice>
                    <PriceAmount $popular={plan.popular}>{plan.price}</PriceAmount>
                    <PricePeriod>{plan.period}</PricePeriod>
                  </PlanPrice>
                </PlanHeader>

                <PlanFeatures>
                  {plan.features.map((feature, featureIndex) => (
                    <FeatureItem key={featureIndex} $disabled={!feature.enabled}>
                      <FeatureIcon>{feature.enabled ? '✅' : '❌'}</FeatureIcon>
                      <FeatureText>{feature.text}</FeatureText>
                    </FeatureItem>
                  ))}
                </PlanFeatures>

                <PlanButton
                  $variant={plan.button.variant}
                  $loading={loading && plan.id === 'premium'}
                  disabled={plan.button.disabled || (loading && plan.id === 'premium')}
                  onClick={plan.button.onClick}
                  whileHover={{ scale: plan.button.disabled ? 1 : 1.02 }}
                  whileTap={{ scale: plan.button.disabled ? 1 : 0.98 }}
                >
                  {loading && plan.id === 'premium' ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>{plan.button.text}</span>
                      {plan.id === 'premium' && !plan.button.disabled && <span>🚀</span>}
                    </>
                  )}
                </PlanButton>

                {plan.guarantee && (
                  <GuaranteeBadge>
                    <span>💰</span>
                    <span>7-day money-back guarantee</span>
                  </GuaranteeBadge>
                )}
              </PlanCard>
            ))}
          </PlansGrid>

          <SecurityNote>
            <div>🔒 Secure payments powered by Razorpay • Cancel anytime</div>
          </SecurityNote>
        </Container>
      </PlansSection>
    </PageContainer>
  );
};

export default PricingPage;
