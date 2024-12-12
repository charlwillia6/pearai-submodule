import { IIdeMessenger } from '../../../context/IdeMessenger';
import { getContinueGlobalPath } from '../../../../../core/util/paths';
import * as path from 'path';

export interface ReviewHistoryItem {
    id: string;
    type: 'working-state' | 'branch-diff' | 'last-commit';
    timestamp: number;
    description: string;
    instructions?: string;
    branch?: string;
}

export class GitReviewHistory {
    private readonly historyFile: string;
    private _history: ReviewHistoryItem[] = [];
    
    constructor(private readonly _ideMessenger: IIdeMessenger) {
        // Get workspace directory from IDE messenger
        this._ideMessenger.request('getCurrentDirectory', {}).then(workspaceDir => {
            // If running in debug mode (workspaceDir is set), store in workspace
            // Otherwise store in global .pearai directory
            this.historyFile = workspaceDir 
                ? path.join(workspaceDir, '.pearai', 'gitReviewHistory.json')
                : path.join(getContinueGlobalPath(), 'gitReviewHistory.json');
            
            this.ensureHistoryFile();
        });
    }

    private async ensureHistoryFile(): Promise<void> {
        if (!this.historyFile) {
            return; // Wait for constructor to finish
        }

        const exists = await this._ideMessenger.request('fileExists', { filepath: this.historyFile });
        if (!exists) {
            // Create parent directory if needed
            const parentDir = path.dirname(this.historyFile);
            const parentExists = await this._ideMessenger.request('fileExists', { filepath: parentDir });
            if (!parentExists) {
                // Create .pearai directory
                await this._ideMessenger.request('writeFile', {
                    path: path.join(parentDir, '.gitkeep'),
                    contents: ''
                });
            }

            // Create history file
            await this._ideMessenger.request('writeFile', { 
                path: this.historyFile, 
                contents: JSON.stringify([]) 
            });
        }
    }

    public async initialize(): Promise<void> {
        await this.ensureHistoryFile();
        this._history = await this.loadHistory();
    }

    private async loadHistory(): Promise<ReviewHistoryItem[]> {
        if (!this.historyFile) {
            return []; // Wait for constructor to finish
        }

        try {
            const data = await this._ideMessenger.request('readFile', { filepath: this.historyFile });
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to load git review history:', error);
            return [];
        }
    }

    private async saveHistory(): Promise<void> {
        if (!this.historyFile) {
            return; // Wait for constructor to finish
        }

        try {
            await this.ensureHistoryFile();
            await this._ideMessenger.request('writeFile', {
                path: this.historyFile,
                contents: JSON.stringify(this._history, null, 2)
            });
        } catch (error) {
            console.error('Failed to save git review history:', error);
        }
    }

    public async addReview(item: Omit<ReviewHistoryItem, 'id' | 'timestamp'>) {
        await this.ensureHistoryFile();
        const historyItem: ReviewHistoryItem = {
            ...item,
            id: this.generateId(),
            timestamp: Date.now()
        };

        this._history.unshift(historyItem);
        
        // Keep only last 50 reviews
        if (this._history.length > 50) {
            this._history = this._history.slice(0, 50);
        }

        await this.saveHistory();
        return historyItem;
    }

    public getHistory(): ReviewHistoryItem[] {
        return [...this._history];
    }

    public async clearHistory(): Promise<void> {
        await this.ensureHistoryFile();
        this._history = [];
        await this.saveHistory();
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2, 15);
    }
}
