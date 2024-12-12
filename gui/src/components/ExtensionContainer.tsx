import { useState } from 'react';
import styled from 'styled-components';
import Layout from './Layout';
import { Chat } from './Chat';
import { GitReview } from './gitReview/GitReview';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--vscode-editor-background);
`;

const TabBar = styled.div`
  display: flex;
  background: var(--vscode-tab-activeBackground);
  border-bottom: 1px solid var(--vscode-tab-border);
`;

const Tab = styled.div<{ active: boolean }>`
  padding: 8px 16px;
  cursor: pointer;
  color: ${props => props.active ? 'var(--vscode-tab-activeForeground)' : 'var(--vscode-tab-inactiveForeground)'};
  background: ${props => props.active ? 'var(--vscode-tab-activeBackground)' : 'var(--vscode-tab-inactiveBackground)'};
  border-bottom: 2px solid ${props => props.active ? 'var(--vscode-tab-activeBorder)' : 'transparent'};
  &:hover {
    background: var(--vscode-tab-hoverBackground);
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

export function ExtensionContainer() {
  const [activeTab, setActiveTab] = useState<'chat' | 'review'>('chat');

  return (
    <Container>
      <TabBar>
        <Tab 
          active={activeTab === 'chat'} 
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </Tab>
        <Tab 
          active={activeTab === 'review'} 
          onClick={() => setActiveTab('review')}
        >
          Review
        </Tab>
      </TabBar>
      <ContentContainer>
        {activeTab === 'chat' ? <Layout /> : <GitReview />}
      </ContentContainer>
    </Container>
  );
}
