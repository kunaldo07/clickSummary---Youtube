'use client'

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

// --- Styled Components ---

const Container = styled.div`
  min-height: 100vh;
  background: #fff;
  font-family: 'Inter', sans-serif;
  padding-top: 80px;
  padding-bottom: 80px;
`;

const HeaderSection = styled.div`
  text-align: center;
  max-width: 800px;
  margin: 0 auto 60px;
  padding: 0 24px;
`;

const HeaderTitle = styled(motion.h1)`
  font-size: 3rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 24px;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 2.25rem;
  }
`;

const HeaderSubtitle = styled(motion.p)`
  font-size: 1.125rem;
  color: #6b7280;
  line-height: 1.6;
`;

const ContentContainer = styled(motion.div)`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
`;

const LastUpdated = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const Section = styled.section`
  margin-bottom: 48px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16px;
`;

const SubsectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 24px 0 12px;
`;

const Paragraph = styled.p`
  color: #4b5563;
  line-height: 1.7;
  margin-bottom: 16px;
  font-size: 1rem;
`;

const List = styled.ul`
  list-style: disc;
  padding-left: 24px;
  margin-bottom: 24px;
  color: #4b5563;
`;

const ListItem = styled.li`
  margin-bottom: 8px;
  line-height: 1.6;
`;

const HighlightBox = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  margin: 24px 0;
`;

const ContactSection = styled.div`
  background: #f3f4f6;
  border-radius: 16px;
  padding: 32px;
  margin-top: 60px;
  text-align: center;
`;

const ContactTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
`;

const EmailLink = styled.a`
  color: #6366f1;
  font-weight: 600;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

export default function PrivacyPageClient() {
  return (
    <Container>
      <HeaderSection>
        <HeaderTitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Privacy Policy
        </HeaderTitle>
        <HeaderSubtitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Your privacy is critically important to us. This policy explains how ClickSummary collects, uses, and protects your information.
        </HeaderSubtitle>
      </HeaderSection>

      <ContentContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <LastUpdated>Last Updated: January 2025</LastUpdated>

        <Section>
          <SectionTitle>1. Introduction</SectionTitle>
          <Paragraph>
            ClickSummary ("we", "our", or "us") provides AI-powered summarization tools for YouTube videos and other web content through our Chrome extension and website. We are committed to protecting your personal information and your right to privacy.
          </Paragraph>
          <Paragraph>
            By using our extensions or website, you consent to the data practices described in this policy.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>2. Information We Collect</SectionTitle>
          
          <SubsectionTitle>2.1 Personal Information</SubsectionTitle>
          <Paragraph>
            When you create an account or sign in via Google, we collect basic profile information to identify you and manage your subscription:
          </Paragraph>
          <List>
            <ListItem><strong>Name & Email Address:</strong> Used for account management, authentication, and communication.</ListItem>
            <ListItem><strong>Profile Picture:</strong> Displayed within the application interface.</ListItem>
            <ListItem><strong>Google User ID:</strong> Used to securely link your account.</ListItem>
          </List>

          <SubsectionTitle>2.2 Usage Data</SubsectionTitle>
          <Paragraph>
            To provide our services, we process certain data when you interact with the extension:
          </Paragraph>
          <List>
            <ListItem><strong>Content Data:</strong> YouTube video transcripts, titles, and metadata are processed temporarily to generate summaries and chat responses.</ListItem>
            <ListItem><strong>Interaction Data:</strong> Chat queries, summary preferences, and feature usage statistics to improve the product.</ListItem>
            <ListItem><strong>Technical Logs:</strong> Error reports and performance metrics to ensure stability.</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>3. How We Use Your Data</SectionTitle>
          <HighlightBox>
            <strong>Key Principle:</strong> We do not sell your personal data to advertisers or third parties. Your data is used strictly to provide and improve the ClickSummary service.
          </HighlightBox>
          <Paragraph>We use the collected information for the following purposes:</Paragraph>
          <List>
            <ListItem><strong>Service Delivery:</strong> To generate AI summaries, answer your questions, and maintain your history.</ListItem>
            <ListItem><strong>Account Management:</strong> To manage your subscription, usage limits, and preferences.</ListItem>
            <ListItem><strong>Communication:</strong> To send important product updates, security alerts, or support responses.</ListItem>
            <ListItem><strong>Improvement:</strong> To analyze usage patterns and fix bugs.</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>4. Third-Party Processors</SectionTitle>
          <Paragraph>
            We use trusted third-party service providers to help us operate our business. These partners are authorized to use your personal information only as necessary to provide these services to us:
          </Paragraph>
          <List>
            <ListItem><strong>OpenAI:</strong> We use OpenAI's API to process text and generate summaries. Data sent to OpenAI via their API is <strong>not</strong> used to train their models.</ListItem>
            <ListItem><strong>Google Firebase/Auth:</strong> For secure authentication and user management.</ListItem>
            <ListItem><strong>Stripe (if applicable):</strong> For secure payment processing. We do not store your credit card details.</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>5. Data Security</SectionTitle>
          <Paragraph>
            We implement industry-standard security measures to protect your data, including encryption in transit (HTTPS/TLS) and secure storage protocols. However, no method of transmission over the internet is 100% secure, so we cannot guarantee absolute security.
          </Paragraph>
        </Section>

        <Section>
          <SectionTitle>6. Your Rights</SectionTitle>
          <Paragraph>
            Depending on your location, you may have rights regarding your personal data, including:
          </Paragraph>
          <List>
            <ListItem><strong>Access:</strong> You can request a copy of the personal data we hold about you.</ListItem>
            <ListItem><strong>Deletion:</strong> You can request that we delete your account and associated data.</ListItem>
            <ListItem><strong>Correction:</strong> You can update your personal information through your account settings.</ListItem>
          </List>
        </Section>

        <Section>
          <SectionTitle>7. Changes to This Policy</SectionTitle>
          <Paragraph>
            We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last Updated" date.
          </Paragraph>
        </Section>

        <ContactSection>
          <ContactTitle>Questions or Concerns?</ContactTitle>
          <Paragraph style={{ marginBottom: '8px' }}>
            If you have any questions about this Privacy Policy, please contact us at:
          </Paragraph>
          <EmailLink href="mailto:kunal@clicksummary.com">kunal@clicksummary.com</EmailLink>
        </ContactSection>

      </ContentContainer>
    </Container>
  );
}
