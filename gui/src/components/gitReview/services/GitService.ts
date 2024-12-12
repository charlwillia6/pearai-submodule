import { GitReviewItem } from '../models/GitReviewItem';
import { IIdeMessenger } from '../../../context/IdeMessenger';

export class GitService {
    constructor(private readonly ideMessenger: IIdeMessenger) {}

    public async reviewWorkingState(instructions: string = ''): Promise<void> {
        try {
            await this.ideMessenger.post('reviewWorkingState', { instructions });
        } catch (error) {
            console.error('Error reviewing working state:', error);
            throw error;
        }
    }

    public async diffWithMain(instructions: string = ''): Promise<void> {
        try {
            await this.ideMessenger.post('diffWithMain', { instructions });
        } catch (error) {
            console.error('Error getting diff with main:', error);
            throw error;
        }
    }

    public async reviewLastCommit(instructions: string = ''): Promise<void> {
        try {
            await this.ideMessenger.post('reviewLastCommit', { instructions });
        } catch (error) {
            console.error('Error reviewing last commit:', error);
            throw error;
        }
    }

    public async clearHistory(): Promise<void> {
        await this.ideMessenger.post('clearReviewHistory', undefined);
    }

    public async refresh(): Promise<void> {
        await this.ideMessenger.post('refreshReview', undefined);
    }
}
