'use client'

import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 120px 24px 80px;
`;

const ContentContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  text-align: center;
  padding: 60px 40px;
`;

const HeaderTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;

  @media (max-width: 768px) {
    font-size: 2rem;
    flex-direction: column;
    gap: 8px;
  }
`;

const HeaderIcon = styled.span`
  font-size: 3rem;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeaderSubtitle = styled.p`
  font-size: 1.25rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const Content = styled.div`
  padding: 60px 40px;
  
  @media (max-width: 768px) {
    padding: 40px 24px;
  }
`;

const LastUpdated = styled.div`
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 40px;
  text-align: center;
  border-left: 4px solid #8b5cf6;
`;

const LastUpdatedText = styled.p`
  color: #4b5563;
  font-size: 0.875rem;
  margin: 0;
  font-weight: 500;
`;

const Section = styled.section`
  margin-bottom: 48px;
`;

const SectionTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
`;

const SubsectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin: 32px 0 16px;
`;

const Paragraph = styled.p`
  color: #4b5563;
  line-height: 1.7;
  margin-bottom: 16px;
  font-size: 1rem;
`;

const List = styled.ul`
  color: #4b5563;
  line-height: 1.7;
  margin-bottom: 16px;
  padding-left: 24px;
`;

const ListItem = styled.li`
  margin-bottom: 8px;
  font-size: 1rem;
`;

const Strong = styled.strong`
  color: #1f2937;
  font-weight: 600;
`;

const Highlight = styled.span`
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
`;

const ContactBox = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  border: 2px solid #e2e8f0;
  margin-top: 40px;
`;

const ContactTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
`;

const ContactEmail = styled.a`
  color: #8b5cf6;
  font-size: 1.125rem;
  font-weight: 600;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

export default function PrivacyPageClient() {
  return (
    <Container>
        <ContentContainer>
          <Header>
            <HeaderTitle>
              <HeaderIcon>🔒</HeaderIcon>
              Privacy Policy
            </HeaderTitle>
            <HeaderSubtitle>
              Your privacy matters to us. Learn how we collect, use, and protect your data.
            </HeaderSubtitle>
          </Header>

          <Content>
            <LastUpdated>
              <LastUpdatedText>
                <Strong>Last Updated:</Strong> January 2025
              </LastUpdatedText>
            </LastUpdated>

            <Section>
              <SectionTitle>1. Overview</SectionTitle>
              <Paragraph>
                <Highlight>ClickSummary</Highlight> is a Chrome extension that generates AI-powered summaries of YouTube videos. 
                This privacy policy explains how we collect, use, store, and protect your personal information when you use our service.
              </Paragraph>
              <Paragraph>
                By using ClickSummary, you agree to the collection and use of information as described in this policy.
              </Paragraph>
            </Section>

            <Section>
              <SectionTitle>2. Information We Collect</SectionTitle>
              
              <SubsectionTitle>2.1 Personally Identifiable Information</SubsectionTitle>
              <Paragraph>When you sign in with Google, we collect:</Paragraph>
              <List>
                <ListItem><Strong>Name</Strong> - For personalization and account identification</ListItem>
                <ListItem><Strong>Email address</Strong> - For account management and communication</ListItem>
                <ListItem><Strong>Profile picture</Strong> - For display in the extension interface</ListItem>
                <ListItem><Strong>Google User ID</Strong> - For secure account linking</ListItem>
              </List>

              <SubsectionTitle>2.2 Authentication Information</SubsectionTitle>
              <Paragraph>To maintain your login session, we store:</Paragraph>
              <List>
                <ListItem><Strong>OAuth tokens</Strong> - Securely stored to keep you signed in</ListItem>
                <ListItem><Strong>Session credentials</Strong> - For seamless extension functionality</ListItem>
              </List>

              <SubsectionTitle>2.3 User Activity Data</SubsectionTitle>
              <Paragraph>To provide and improve our service, we track:</Paragraph>
              <List>
                <ListItem><Strong>Summary generation requests</Strong> - Number and timing of summaries</ListItem>
                <ListItem><Strong>Chat queries</Strong> - Questions asked about video content</ListItem>
                <ListItem><Strong>Feature usage</Strong> - Which summary formats and lengths you prefer</ListItem>
                <ListItem><Strong>Error logs</Strong> - Technical issues for debugging purposes</ListItem>
              </List>

              <SubsectionTitle>2.4 Website Content</SubsectionTitle>
              <Paragraph>To generate summaries, we process:</Paragraph>
              <List>
                <ListItem><Strong>YouTube video transcripts</Strong> - Extracted from videos you choose to summarize</ListItem>
                <ListItem><Strong>Video metadata</Strong> - Title, duration, and video ID for context</ListItem>
              </List>
            </Section>

            <Section>
              <SectionTitle>3. How We Use Your Information</SectionTitle>
              
              <SubsectionTitle>3.1 Primary Functions</SubsectionTitle>
              <List>
                <ListItem><Strong>AI Summarization:</Strong> Video transcripts are sent to OpenAI's API to generate summaries</ListItem>
                <ListItem><Strong>Chat Functionality:</Strong> Your questions and video context are processed to provide relevant answers</ListItem>
                <ListItem><Strong>Account Management:</Strong> Your Google information is used for authentication and personalization</ListItem>
                <ListItem><Strong>Service Delivery:</Strong> Usage data helps us maintain and improve the extension</ListItem>
              </List>

              <SubsectionTitle>3.2 Service Improvement</SubsectionTitle>
              <List>
                <ListItem>Analyze usage patterns to enhance features</ListItem>
                <ListItem>Debug technical issues and improve performance</ListItem>
                <ListItem>Understand user preferences for better experiences</ListItem>
              </List>
            </Section>

            <Section>
              <SectionTitle>4. Data Sharing and Third Parties</SectionTitle>
              
              <SubsectionTitle>4.1 OpenAI Processing</SubsectionTitle>
              <Paragraph>
                <Strong>Video transcripts and chat queries are sent to OpenAI</Strong> to generate AI-powered summaries and responses. 
                This is essential for our service functionality. OpenAI processes this data according to their own privacy policy 
                and does not use it to train their models when accessed via API.
              </Paragraph>

              <SubsectionTitle>4.2 Google Services</SubsectionTitle>
              <Paragraph>
                We use <Strong>Google OAuth</Strong> for secure authentication. Google processes your login according to their privacy policy.
              </Paragraph>

              <SubsectionTitle>4.3 No Data Selling</SubsectionTitle>
              <Paragraph>
                <Strong>We do not sell, rent, or trade your personal information</Strong> to any third parties for marketing or other purposes.
              </Paragraph>
            </Section>

            <Section>
              <SectionTitle>5. Data Storage and Security</SectionTitle>
              
              <SubsectionTitle>5.1 Local Storage</SubsectionTitle>
              <List>
                <ListItem>Authentication tokens are stored locally in your browser</ListItem>
                <ListItem>Preferences and settings are saved on your device</ListItem>
                <ListItem>No sensitive data is permanently stored on our servers</ListItem>
              </List>

              <SubsectionTitle>5.2 Security Measures</SubsectionTitle>
              <List>
                <ListItem><Strong>Encryption:</Strong> All data transmission uses HTTPS/TLS encryption</ListItem>
                <ListItem><Strong>Secure APIs:</Strong> Authentication required for all backend requests</ListItem>
                <ListItem><Strong>Limited Access:</Strong> Data is only processed for the stated purposes</ListItem>
                <ListItem><Strong>No Persistent Storage:</Strong> Video content is processed in real-time, not stored</ListItem>
              </List>
            </Section>

            <Section>
              <SectionTitle>6. Data Retention</SectionTitle>
              <Paragraph>
                <Strong>Account Information:</Strong> Retained while your account is active and for a reasonable period after deletion.
              </Paragraph>
              <Paragraph>
                <Strong>Usage Data:</Strong> Aggregated analytics may be retained for service improvement purposes.
              </Paragraph>
              <Paragraph>
                <Strong>Video Content:</Strong> Transcripts are not permanently stored and are only processed temporarily for summarization.
              </Paragraph>
            </Section>

            <Section>
              <SectionTitle>7. Your Rights and Choices</SectionTitle>
              
              <SubsectionTitle>7.1 Account Control</SubsectionTitle>
              <List>
                <ListItem><Strong>Access:</Strong> View your account information in the extension</ListItem>
                <ListItem><Strong>Deletion:</Strong> Sign out to remove local data; contact us to delete server-side data</ListItem>
                <ListItem><Strong>Portability:</Strong> Request a copy of your data</ListItem>
              </List>

              <SubsectionTitle>7.2 Browser Controls</SubsectionTitle>
              <List>
                <ListItem>Uninstall the extension to stop all data collection</ListItem>
                <ListItem>Revoke Google OAuth permissions in your Google Account settings</ListItem>
                <ListItem>Clear browser storage to remove local data</ListItem>
              </List>
            </Section>

            <Section>
              <SectionTitle>8. Children's Privacy</SectionTitle>
              <Paragraph>
                ClickSummary is not intended for children under 13. We do not knowingly collect personal information from children under 13. 
                If you become aware that a child has provided us with personal information, please contact us.
              </Paragraph>
            </Section>

            <Section>
              <SectionTitle>9. Changes to This Policy</SectionTitle>
              <Paragraph>
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy 
                on this page and updating the "Last Updated" date. We encourage you to review this policy periodically.
              </Paragraph>
            </Section>

            <Section>
              <SectionTitle>10. Legal Compliance</SectionTitle>
              <Paragraph>
                This policy complies with applicable privacy laws including GDPR, CCPA, and Chrome Web Store requirements. 
                We process data lawfully, fairly, and transparently.
              </Paragraph>
            </Section>

            <ContactBox>
              <ContactTitle>Questions About Privacy?</ContactTitle>
              <Paragraph>
                If you have any questions about this privacy policy or our data practices, please contact us at:
              </Paragraph>
              <ContactEmail href="mailto:kunal@clicksummary.com">
                kunal@clicksummary.com
              </ContactEmail>
            </ContactBox>
          </Content>
        </ContentContainer>
      </Container>
  );
}