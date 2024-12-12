import React, { useContext, useCallback, useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { IdeMessengerContext } from '../../context/IdeMessenger';
import styled from 'styled-components';
import { ReviewHistoryItem, GitReviewHistory } from './models/GitReviewHistory';
import { GitService } from './services/GitService';

const ReviewContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    padding: 16px;
    align-items: center;
    background: var(--vscode-editor-background);
`;

const ReviewContent = styled.div`
    flex: 1;
    width: 100%;
    max-width: 600px;
    overflow-y: auto;
`;

const ReviewTextArea = styled.textarea`
    width: 100%;
    max-width: 600px;
    min-height: 100px;
    padding: 8px 16px;
    margin-bottom: 16px;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    resize: vertical;
    box-sizing: border-box;
`;

const ReviewButton = styled.button`
    width: 100%;
    padding: 8px;
    margin-bottom: 8px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
        background: var(--vscode-button-hoverBackground);
    }
`;

const ButtonRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
    max-width: 600px;
    margin-bottom: 8px;

    ${ReviewButton} {
        margin-bottom: 0;
    }
`;

const HistorySection = styled.div`
    margin-top: 24px;
    width: 100%;
    max-width: 600px;
    border-top: 1px solid var(--vscode-panel-border);
    padding-top: 16px;
`;

const HistoryHeader = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 16px;
`;

const HistoryTitle = styled.h3`
    margin: 0;
    color: var(--vscode-foreground);
    font-size: 14px;
    font-weight: 600;
`;

const HistoryItem = styled.div`
    width: 100%;
    padding: 12px;
    margin-bottom: 8px;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    border-radius: 4px;
    box-sizing: border-box;
`;

const HistoryItemHeader = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
`;

const HistoryItemType = styled.span`
    color: var(--vscode-foreground);
    font-weight: 500;
`;

const HistoryItemTime = styled.span`
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
`;

const HistoryItemDescription = styled.div`
    color: var(--vscode-foreground);
    margin-bottom: 8px;
`;

const HistoryItemInstructions = styled.div`
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
    font-style: italic;
`;

export function GitReview() {
    const dispatch = useDispatch();
    const ideMessenger = useContext(IdeMessengerContext);
    const [instructions, setInstructions] = useState("");
    const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
    const gitReviewHistory = useMemo(() => new GitReviewHistory(ideMessenger), [ideMessenger]);
    
    const gitService = new GitService(ideMessenger);

    useEffect(() => {
        const loadHistory = async () => {
            await gitReviewHistory.initialize();
            setHistory(gitReviewHistory.getHistory());
        };
        loadHistory();
    }, [gitReviewHistory]);

    const addToHistory = useCallback(async (type: ReviewHistoryItem['type'], description: string) => {
        await gitReviewHistory.addReview({
            type,
            description,
            instructions: instructions || undefined
        });
        
        setHistory(gitReviewHistory.getHistory());
    }, [instructions, gitReviewHistory]);

    const handleReviewWorkingState = useCallback(async () => {
        await gitService.reviewWorkingState(instructions);
        await addToHistory('working-state', 'Reviewed working state');
    }, [gitService, instructions, addToHistory]);

    const handleDiffWithMain = useCallback(async () => {
        await gitService.diffWithMain(instructions);
        await addToHistory('branch-diff', 'Compared with main branch');
    }, [gitService, instructions, addToHistory]);

    const handleReviewLastCommit = useCallback(async () => {
        await gitService.reviewLastCommit(instructions);
        await addToHistory('last-commit', 'Reviewed last commit');
    }, [gitService, instructions, addToHistory]);

    const handleClearHistory = useCallback(async () => {
        await gitService.clearHistory();
        await gitReviewHistory.clearHistory();
        setHistory([]);
    }, [gitService, gitReviewHistory]);

    const handleRefresh = useCallback(async () => {
        await gitService.refresh();
    }, [gitService]);

    const formatTime = (timestamp: number) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(timestamp));
    };

    return (
        <ReviewContainer>
            <ReviewTextArea 
                placeholder="Add review instructions (optional)"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
            />
            <ReviewButton onClick={handleReviewWorkingState}>
                Review Working State
            </ReviewButton>
            <ReviewButton onClick={handleDiffWithMain}>
                Diff with Main
            </ReviewButton>
            <ReviewButton onClick={handleReviewLastCommit}>
                Review Last Commit
            </ReviewButton>
            <ButtonRow>
                <ReviewButton onClick={handleClearHistory}>
                    Clear History
                </ReviewButton>
                <ReviewButton onClick={handleRefresh}>
                    Refresh
                </ReviewButton>
            </ButtonRow>

            <HistorySection>
                <HistoryHeader>
                    <HistoryTitle>Review History</HistoryTitle>
                </HistoryHeader>
                {history.map(item => (
                    <HistoryItem key={item.id}>
                        <HistoryItemHeader>
                            <HistoryItemType>
                                {item.type === 'working-state' ? 'Working State' :
                                 item.type === 'branch-diff' ? 'Branch Diff' :
                                 'Last Commit'}
                            </HistoryItemType>
                            <HistoryItemTime>{formatTime(item.timestamp)}</HistoryItemTime>
                        </HistoryItemHeader>
                        <HistoryItemDescription>{item.description}</HistoryItemDescription>
                        {item.instructions && (
                            <HistoryItemInstructions>
                                Instructions: {item.instructions}
                            </HistoryItemInstructions>
                        )}
                    </HistoryItem>
                ))}
            </HistorySection>
        </ReviewContainer>
    );
}
