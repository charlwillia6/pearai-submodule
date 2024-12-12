import React from 'react';
import styled from 'styled-components';
import { Chat } from './Chat';
import { GitReview } from './gitReview/GitReview';
import * as Tabs from '@radix-ui/react-tabs';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && (
                <div>
                    {children}
                </div>
            )}
        </div>
    );
}

const TabsRoot = styled(Tabs.Root)`
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
`;

const TabsList = styled(Tabs.List)`
    display: flex;
    border-bottom: 1px solid var(--vscode-panel-border);
    background: var(--vscode-titleBar-activeBackground);
`;

const TabsTrigger = styled(Tabs.Trigger)`
    padding: 8px 16px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--vscode-foreground);
    cursor: pointer;
    &[data-state='active'] {
        border-bottom: 2px solid var(--vscode-focusBorder);
        background: var(--vscode-tab-activeBackground);
    }
`;

const TabsContent = styled(Tabs.Content)`
    flex: 1;
    height: calc(100vh - 35px);
    overflow: auto;
`;

export function TabContainer() {
    return (
        <TabsRoot defaultValue="chat">
            <TabsList>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>
            <TabsContent value="chat">
                <Chat />
            </TabsContent>
            <TabsContent value="review">
                <GitReview />
            </TabsContent>
        </TabsRoot>
    );
}
