'use client'

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { usePayment } from '../../hooks/usePayment';
import toast from 'react-hot-toast';
import { detectUserCountry, getPricingForCountry, formatPrice } from '../../utils/pricingConfig';

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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  
  &::before {
    content: '';
    position: absolute;
    top: 10%;
    left: 10%;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: float1 6s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 20%;
    right: 15%;
    width: 150px;
    height: 150px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 50%;
    animation: float2 8s ease-in-out infinite;
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
  padding: 80px 24px 60px;
  text-align: center;
  position: relative;
  z-index: 1;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const HeroTitle = styled(motion.h1)`
  font-size: 3rem;
  font-weight: 900;
  color: white;
  margin-bottom: 24px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 600px;
  margin: 0 auto 48px;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const PlansSection = styled.section`
  padding: 0 24px 80px;
  position: relative;
  z-index: 1;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 64px;
  color: #1f2937;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 32px;
  max-width: 800px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const PlanCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 2px solid ${props => props.$popular ? '#8b5cf6' : 'rgba(255, 255, 255, 0.2)'};
  position: relative;
  transform: ${props => props.$popular ? 'scale(1.05)' : 'scale(1)'};
  
  @media (max-width: 768px) {
    transform: scale(1);
    padding: 32px;
  }
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
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PlanHeader = styled.div`
  margin-bottom: 32px;
`;

const PlanName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
`;

const PlanPrice = styled.div`
  margin-bottom: 8px;
`;

const PriceAmount = styled.span`
  font-size: ${props => props.$popular ? '3rem' : '2.5rem'};
  font-weight: 900;
  color: ${props => props.$popular ? '#8b5cf6' : '#1f2937'};
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const PricePeriod = styled.span`
  font-size: 1rem;
  color: #6b7280;
  margin-left: 8px;
`;

const PlanFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 32px 0;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FeatureIcon = styled.span`
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
`;

const FeatureText = styled.span`
  color: #374151;
  font-size: 1rem;
  text-decoration: ${props => props.$disabled ? 'line-through' : 'none'};
`;

const PlanButton = styled(motion.button)`
  width: 100%;
  padding: 16px 32px;
  font-size: 1.125rem;
  font-weight: 700;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  background: ${props => {
    if (props.disabled) return '#e5e7eb';
    if (props.$variant === 'premium') return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
    return 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
  }};
  
  color: ${props => {
    if (props.disabled) return '#9ca3af';
    if (props.$variant === 'premium') return 'white';
    return '#374151';
  }};
  
  box-shadow: ${props => props.disabled ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.15)'};
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    cursor: not-allowed;
  }
  
  span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
  }
`;

const GuaranteeBadge = styled.div`
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #059669;
  font-size: 0.875rem;
  font-weight: 600;
  
  span:first-child {
    font-size: 1rem;
  }
`;

const ValueSection = styled.section`
  padding: 60px 24px;
  background: white;
  position: relative;
  z-index: 1;
`;

const ValueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 32px;
  max-width: 1000px;
  margin: 0 auto;
`;

const ValueCard = styled(motion.div)`
  text-align: center;
  padding: 24px;
`;

const ValueIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
`;

const ValueTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

const ValueDescription = styled.p`
  color: #6b7280;
  line-height: 1.6;
  font-size: 0.95rem;
`;

const SavingsHighlight = styled.div`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 700;
  display: inline-block;
  margin-top: 8px;
`;

const ROISection = styled.div`
  background: rgba(139, 92, 246, 0.1);
  border-radius: 16px;
  padding: 24px;
  margin-top: 24px;
  border: 2px solid #8b5cf6;
`;

const ROITitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #7c3aed;
  margin-bottom: 12px;
  text-align: center;
`;

const ROIText = styled.div`
  font-size: 0.9rem;
  color: #6b7280;
  text-align: center;
  line-height: 1.6;
`;

export default function PricingPageClient() {
  const { user, isAuthenticated } = useAuth();
  const { subscribeToPremium, loading } = usePayment();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [pricing, setPricing] = useState(null);
  const [countryCode, setCountryCode] = useState('IN');
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
        setCountryCode(detectedCountry);
        const pricingConfig = getPricingForCountry(detectedCountry);
        setPricing(pricingConfig);
      } catch (error) {
        console.error('Error loading pricing:', error);
        // Fallback to default pricing
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

  // Don't render plans until pricing is loaded
  if (isLoadingPricing || !pricing) {
    return (
      <PageContainer>
        <BackgroundPattern />
        <FloatingElements />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'white', fontSize: '1.5rem' }}>
          Loading pricing...
        </div>
      </PageContainer>
    );
  }

  // Simplified plans - only Free and Monthly (with dynamic pricing)
  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      price: `${pricing.currency}0`,
      period: 'forever',
      description: 'Perfect for trying out ClickSummary',
      features: [
        { text: '5 summaries per day', enabled: true, value: `Worth ${formatPrice(pricing.freeValue.summaries, pricing.currency)}/month` },
        { text: '1 AI chat per day', enabled: true, value: `Worth ${formatPrice(pricing.freeValue.chat, pricing.currency)}/month` },
        { text: 'Basic video summaries', enabled: true },
        { text: 'Standard processing time', enabled: true },
        { text: 'Unlimited AI chat', enabled: false },
        { text: 'Export & save summaries', enabled: false },
        { text: 'Priority support', enabled: false },
        { text: 'Custom summary formats', enabled: false }
      ],
      button: {
        text: currentPlan === 'free' ? 'Current Plan' : 'Start Free',
        variant: 'free',
        disabled: currentPlan === 'free',
        onClick: handleSelectFreePlan
      }
    },
    {
      id: 'monthly',
      name: 'Premium Pro',
      price: formatPrice(pricing.monthly, pricing.currency),
      period: 'per month',
      popular: true,
      description: 'For serious learners & professionals',
      savings: `Save 20+ hours/week = ${formatPrice(pricing.monthlyValue / 4, pricing.currency)}+ value`,
      features: [
        { text: 'Unlimited summaries', enabled: true, value: `Worth ${formatPrice(pricing.premiumValue.summaries, pricing.currency)}/month` },
        { text: 'Unlimited AI chat', enabled: true, value: `Worth ${formatPrice(pricing.premiumValue.chat, pricing.currency)}/month` },
        { text: 'All summary formats', enabled: true, value: `Worth ${formatPrice(pricing.premiumValue.formats, pricing.currency)}/month` },
        { text: 'Export & save summaries', enabled: true, value: `Worth ${formatPrice(pricing.premiumValue.export, pricing.currency)}/month` },
        { text: 'Priority processing', enabled: true, value: `Worth ${formatPrice(pricing.premiumValue.priority, pricing.currency)}/month` },
        { text: 'Custom summary formats', enabled: true, value: `Worth ${formatPrice(pricing.premiumValue.custom, pricing.currency)}/month` },
        { text: 'Priority email support', enabled: true },
        { text: 'Early access to new features', enabled: true }
      ],
      button: {
        text: currentPlan === 'monthly' ? 'Current Plan' : 'Start Premium Now',
        variant: 'premium',
        disabled: currentPlan === 'monthly',
        onClick: () => handleSubscribeToPremium('monthly')
      },
      guarantee: true,
      roi: true
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
            Invest {formatPrice(pricing.monthly, pricing.currency)}/month, Save 20+ Hours Every Week
          </HeroTitle>
          <HeroSubtitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            That's less than {formatPrice(Math.ceil(pricing.monthly / 30), pricing.currency)}/day to reclaim your time. Join 10,000+ users who've transformed how they learn.
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
                  {plan.description && (
                    <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '16px' }}>
                      {plan.description}
                    </div>
                  )}
                  <PlanPrice>
                    <PriceAmount $popular={plan.popular}>{plan.price}</PriceAmount>
                    <PricePeriod>{plan.period}</PricePeriod>
                  </PlanPrice>
                  {plan.savings && (
                    <SavingsHighlight>{plan.savings}</SavingsHighlight>
                  )}
                </PlanHeader>

                <PlanFeatures>
                  {plan.features.map((feature, featureIndex) => (
                    <FeatureItem key={featureIndex} $disabled={!feature.enabled}>
                      <FeatureIcon>{feature.enabled ? '✅' : '❌'}</FeatureIcon>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <FeatureText $disabled={!feature.enabled}>{feature.text}</FeatureText>
                        {feature.value && feature.enabled && (
                          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '600', marginTop: '2px' }}>
                            {feature.value}
                          </div>
                        )}
                      </div>
                    </FeatureItem>
                  ))}
                </PlanFeatures>

                {plan.roi && (
                  <ROISection>
                    <ROITitle>💰 Return on Investment</ROITitle>
                    <ROIText>
                      If your time is worth {formatPrice(pricing.hourlyValue, pricing.currency)}/hour, saving 20 hours/week = {formatPrice(pricing.monthlyValue, pricing.currency)}/month value.
                      <br />
                      <strong style={{ color: '#7c3aed', fontSize: '1.1rem' }}>That's {pricing.roi} ROI!</strong>
                    </ROIText>
                  </ROISection>
                )}

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

      <ValueSection>
        <Container>
          <SectionTitle style={{ color: '#1f2937', marginBottom: '48px' }}>Why Premium Users Love ClickSummary</SectionTitle>
          <ValueGrid>
            <ValueCard
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <ValueIcon>⏰</ValueIcon>
              <ValueTitle>Save 20+ Hours Weekly</ValueTitle>
              <ValueDescription>
                Stop watching hour-long videos. Get the key insights in seconds and use your time for what matters.
              </ValueDescription>
            </ValueCard>

            <ValueCard
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ValueIcon>🧠</ValueIcon>
              <ValueTitle>Learn 10x Faster</ValueTitle>
              <ValueDescription>
                Consume more content, retain more information, and accelerate your learning journey exponentially.
              </ValueDescription>
            </ValueCard>

            <ValueCard
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ValueIcon>💼</ValueIcon>
              <ValueTitle>Stay Ahead Professionally</ValueTitle>
              <ValueDescription>
                Keep up with industry trends, competitor analysis, and professional development effortlessly.
              </ValueDescription>
            </ValueCard>

            <ValueCard
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <ValueIcon>🎯</ValueIcon>
              <ValueTitle>Zero Risk Guarantee</ValueTitle>
              <ValueDescription>
                Try Premium risk-free for 7 days. Not satisfied? Get a full refund, no questions asked.
              </ValueDescription>
            </ValueCard>
          </ValueGrid>

          <div style={{ textAlign: 'center', marginTop: '64px' }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '48px',
                borderRadius: '24px',
                maxWidth: '700px',
                margin: '0 auto'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🚀</div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '16px' }}>
                Limited Time Offer: 50% Off First Month
              </h3>
              <p style={{ fontSize: '1.1rem', opacity: '0.95', marginBottom: '24px' }}>
                Join in the next 24 hours and get Premium for just {formatPrice(pricing.discountedMonthly, pricing.currency)} for your first month.
                <br />
                <strong>Only 23 spots remaining!</strong>
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.9rem', opacity: '0.9' }}>
                <span>✓ Cancel Anytime</span>
                <span>✓ 7-Day Money Back</span>
                <span>✓ Instant Access</span>
              </div>
            </motion.div>
          </div>
        </Container>
      </ValueSection>
    </PageContainer>
  );
}