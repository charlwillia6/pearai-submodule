import * as vscode from 'vscode';
import { ContinueGUIWebviewViewProvider, PEAR_CONTINUE_VIEW_ID } from '../ContinueGUIWebviewViewProvider';
import { v4 as uuidv4 } from 'uuid';

export class TabManager {
    private readonly chatProvider: ContinueGUIWebviewViewProvider;
    private readonly configHandlerPromise: Promise<any>;
    private readonly windowId: string;
    
    constructor(context: vscode.ExtensionContext) {
        this.windowId = uuidv4();
        this.configHandlerPromise = new Promise((resolve) => {});
        this.chatProvider = new ContinueGUIWebviewViewProvider(
            this.configHandlerPromise,
            this.windowId,
            context
        );
    }

    public registerProviders(context: vscode.ExtensionContext) {
        // Register the chat provider
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                PEAR_CONTINUE_VIEW_ID,
                this.chatProvider
            )
        );
    }

    public getChatProvider(): ContinueGUIWebviewViewProvider {
        return this.chatProvider;
    }
}
