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
    background: ${props => props.$popular ? 
      'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)' : 
      'rgba(255, 255, 255, 0.5)'};
    z-index: -1;
    border-radius: 17px;
  }

  ${props => props.$popular && `
    border-color: #8b5cf6;
    transform: scale(1.05);
    box-shadow: 0 16px 64px rgba(139, 92, 246, 0.15);
  `}

  &:hover {
    transform: ${props => props.$popular ? 'scale(1.08)' : 'scale(1.02)'};
    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.12);
  }
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  padding: 8px 20px;
  border-radius: 0 0 12px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
`;

const PlanHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const PlanName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

const PlanPrice = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const PriceAmount = styled.span`
  font-size: 3rem;
  font-weight: 900;
  color: ${props => props.$popular ? '#8b5cf6' : '#1f2937'};
  line-height: 1;
`;

const PricePeriod = styled.span`
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
`;

const PlanFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 32px 0;
  space-y: 12px;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  color: ${props => props.$disabled ? '#9ca3af' : '#374151'};
  opacity: ${props => props.$disabled ? 0.6 : 1};
`;

const FeatureIcon = styled.span`
  font-size: 1.125rem;
  flex-shrink: 0;
`;

const FeatureText = styled.span`
  font-size: 0.875rem;
  line-height: 1.5;
`;

const PlanButton = styled(motion.button)`
  width: 100%;
  padding: 16px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  ${props => {
    if (props.$variant === 'free') {
      return `
        background: #f3f4f6;
        color: #6b7280;
        border: 2px solid #e5e7eb;

        &:hover:not(:disabled) {
          background: #e5e7eb;
          color: #374151;
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `;
    } else {
      return `
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);

        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `;
    }
  }}

  ${props => props.$loading && `
    opacity: 0.8;
    cursor: wait;
  `}
`;

const GuaranteeBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 8px;
  font-size: 0.875rem;
  color: #059669;
  font-weight: 500;
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

  const handleSubscribeToPremium = async (planType = 'monthly') => {
    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe');
      return;
    }

    const result = await subscribeToPremium(planType);
    if (result.success) {
      setCurrentPlan(planType);
    }
  };

  const handleSelectFreePlan = () => {
    if (currentPlan === 'monthly') { // Simplified - only check for monthly
      toast('You can downgrade to Free plan from your account settings', {
        icon: 'ℹ️'
      });
    } else {
      toast.success('You are already on the Free plan!');
    }
  };

  // Simplified plans - only Free and Monthly
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: 'forever',
      features: [
        { text: '5 summaries per day', enabled: true },
        { text: '1 AI chat per day', enabled: true },
        { text: 'Basic video summaries', enabled: true },
        { text: 'Standard processing time', enabled: true },
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
      id: 'monthly',
      name: 'Premium',
      price: '₹800',
      period: 'per month',
      popular: true,
      features: [
        { text: 'Unlimited summaries', enabled: true },
        { text: 'Unlimited AI chat', enabled: true },
        { text: 'All summary formats', enabled: true },
        { text: 'Export summaries', enabled: true },
        { text: 'Priority processing', enabled: true },
        { text: 'Custom summary formats', enabled: true }
      ],
      button: {
        text: currentPlan === 'monthly' ? 'Current Plan' : 'Upgrade to Premium',
        variant: 'premium',
        disabled: currentPlan === 'monthly',
        onClick: () => handleSubscribeToPremium('monthly')
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
            transition={{ duration: 0.8 }}
          >
            Simple Pricing for Everyone
          </HeroTitle>
          <HeroSubtitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Choose the perfect plan for your YouTube summary needs. Start free, upgrade when you're ready.
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
                  $loading={loading && plan.id === 'monthly'}
                  disabled={plan.button.disabled || (loading && plan.id === 'monthly')}
                  onClick={plan.button.onClick}
                  whileHover={{ scale: plan.button.disabled ? 1 : 1.02 }}
                  whileTap={{ scale: plan.button.disabled ? 1 : 0.98 }}
                >
                  {loading && plan.id === 'monthly' ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>{plan.button.text}</span>
                      {plan.id === 'monthly' && !plan.button.disabled && <span>🚀</span>}
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
        </Container>
      </PlansSection>
    </PageContainer>
  );
};

export default PricingPage;