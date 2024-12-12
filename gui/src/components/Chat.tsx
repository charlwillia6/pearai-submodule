import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { IdeMessengerContext } from '../context/IdeMessenger';
import { JSONContent } from '@tiptap/react';
import { InputModifiers } from 'core';
import useChatHandler from '../hooks/useChatHandler';
import { setInactive } from '../redux/slices/stateSlice';
import { isMetaEquivalentKeyPressed } from '../util';
import { getMetaKeyLabel } from '../util';
import styled from 'styled-components';
import ContinueInputBox from './mainInput/ContinueInputBox';

const ChatContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background: var(--vscode-editor-background);
    overflow: hidden;
`;

const ChatContent = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 16px;
`;

const InputContainer = styled.div`
    padding: 16px;
    background: var(--vscode-editor-background);
    border-top: 1px solid var(--vscode-panel-border);
`;

const StopButton = styled.button`
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    &:hover {
        background: var(--vscode-button-hoverBackground);
    }
`;

export function Chat() {
    const dispatch = useDispatch();
    const ideMessenger = useContext(IdeMessengerContext);
    const active = useSelector((state: RootState) => state.state.active);
    const chatState = useSelector((state: RootState) => state.state);

    const chatHandler = useChatHandler(dispatch, ideMessenger);

    useEffect(() => {
        const listener = (e: KeyboardEvent) => {
            if (e.key === "Backspace" && isMetaEquivalentKeyPressed(e) && !e.shiftKey) {
                dispatch(setInactive());
            }
        };
        window.addEventListener("keydown", listener);
        return () => window.removeEventListener("keydown", listener);
    }, [active]);

    const handleSubmit = useCallback((editorState: JSONContent, modifiers: InputModifiers) => {
        chatHandler.streamResponse(editorState, modifiers, ideMessenger);
    }, [chatHandler, ideMessenger]);

    return (
        <ChatContainer>
            <ChatContent>
                {/* Chat messages would go here */}
            </ChatContent>
            <InputContainer>
                <ContinueInputBox
                    onEnter={handleSubmit}
                    isLastUserInput={false}
                    isMainInput={true}
                    hidden={active}
                />
            </InputContainer>
            {active && (
                <StopButton
                    onClick={() => {
                        dispatch(setInactive());
                        if (chatState.history[chatState.history.length - 1]?.message.content.length === 0) {
                            chatState.history.pop();
                        }
                    }}
                >
                    {getMetaKeyLabel()} ⌫ Cancel
                </StopButton>
            )}
        </ChatContainer>
    );
}
