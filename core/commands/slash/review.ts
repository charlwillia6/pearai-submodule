import { SlashCommand } from "../../index.js";
import { stripImages } from "../../llm/images.js";
import * as vscode from "vscode";
import { 
  WORKING_STATE_PROMPT,
  DIFF_WITH_MAIN_PROMPT,
  LAST_COMMIT_PROMPT
} from "./reviewPrompts.js";

// Error messages for common scenarios
const errorMessages = {
  "noChanges": "No changes detected in the working state.",
  "noIssues": "No issues or suggestions found. The code looks good and follows best practices! 👍",
  "noRepo": "No Git repository detected in the current workspace.",
  "noCommit": "Unable to retrieve the last commit. Please ensure you have at least one commit in your repository.",
  "diffError": "Error retrieving diff content. Please ensure you have proper Git access and try again.",
  "reviewError": "An error occurred during the review process. Please try again."
};

// Helper function to handle review errors
const handleReviewError = async function* (fn: () => Promise<string>) {
  try {
    return await fn();
  } catch (error: unknown) {
    console.error("Review command error:", error);
    if (error instanceof Error) {
      return `Error executing review command: ${error.message}`;
    }
    return `Error executing review command: ${String(error)}`;
  }
};

// Helper function to stream LLM response
const streamLLMResponse = async function* (llm: any, prompt: string) {
  try {
    for await (const chunk of llm.streamChat([{ role: "user", content: prompt }])) {
      const content = stripImages(chunk.content);
      if (typeof content === 'string') {
        yield content;
      }
    }
  } catch (error) {
    console.error("Error streaming LLM response:", error);
    yield `Error: Failed to stream response - ${error instanceof Error ? error.message : String(error)}`;
  }
};

// Helper function to get Git repository
const getGitRepo = async () => {
  const gitExtension = vscode.extensions.getExtension<any>("vscode.git");
  if (!gitExtension?.exports?.getAPI) {
    throw new Error("Git extension not found or invalid.");
  }
  
  const git = gitExtension.exports.getAPI(1);
  const repo = git?.repositories[0];
  if (!repo) {
    throw new Error("No Git repository found in workspace.");
  }

  return repo;
};

// Helper function to get diff content
const getDiffContent = async (repo: any, options: { ref1?: string, ref2?: string, includeStaged?: boolean } = {}) => {
  try {
    if (!repo || !repo.repository) {
      throw new Error("Invalid git repository");
    }

    const { ref1, ref2, includeStaged = false } = options;
    let diffContent = "";
    
    // For working directory changes
    if (!ref1 && !ref2) {
      // Get unstaged changes
      const unstagedDiff = await repo.repository.diff(false);
      diffContent = unstagedDiff || "";
      
      // Get staged changes if requested
      if (includeStaged) {
        const stagedDiff = await repo.repository.diff(true);
        if (stagedDiff) {
          diffContent += (diffContent ? "\n" : "") + stagedDiff;
        }
      }
    } 
    // For comparing two refs
    else if (ref1 && ref2) {
      diffContent = await repo.repository.diffBetween(ref1, ref2) || "";
    }
    // For single ref (last commit)
    else if (ref1) {
      diffContent = await repo.repository.diffBetween(ref1 + "^", ref1) || "";
    }
    
    return diffContent;
  } catch (error) {
    console.error("Error getting diff:", error);
    throw error;
  }
};

export const reviewWorkingStateCommand: SlashCommand = {
  "name": "review-working",
  "description": "Review current working state changes for code quality and issues",
  "run": async function* ({ llm }) {
    const result = yield* handleReviewError(async () => {
      const repo = await getGitRepo();
      if (!repo) {
        return "Error: Git repository not found";
      }

      let diffContent = await getDiffContent(repo, { includeStaged: true });
      
      // Ensure diffContent is a string and handle null/undefined
      diffContent = diffContent != null ? String(diffContent) : "";
      
      if (!diffContent) {
        return "No changes detected in the working state. Make some changes first and try again.";
      }
      
      const prompt = WORKING_STATE_PROMPT(diffContent);
      return typeof prompt === 'string' ? prompt : String(prompt);
    });

    if (typeof result === 'string') {
      if (!result.startsWith("No changes") && !result.startsWith("Error")) {
        yield* streamLLMResponse(llm, result);
      } else {
        yield result;
      }
    } else {
      yield "Error: Unexpected result type";
    }
  },
};

export const reviewMainCommand: SlashCommand = {
  "name": "review-main",
  "description": "Review changes compared to main branch for code quality and issues",
  "run": async function* ({ llm }) {
    const result = yield* handleReviewError(async () => {
      const repo = await getGitRepo();
      if (!repo) {
        return "Error: Git repository not found";
      }

      // Check for main/master branch
      const mainBranch = await repo.repository.getBranch("main") ? "main" : 
                        await repo.repository.getBranch("master") ? "master" : null;
      
      if (!mainBranch) {
        return "Main/master branch not found. Please ensure either 'main' or 'master' branch exists.";
      }

      let diffContent = await getDiffContent(repo, { ref1: mainBranch });
      
      // Ensure diffContent is a string and handle null/undefined
      diffContent = diffContent != null ? String(diffContent) : "";
      
      if (!diffContent) {
        return `No changes detected compared to ${mainBranch} branch.`;
      }

      const prompt = WORKING_STATE_PROMPT(diffContent);
      return typeof prompt === 'string' ? prompt : String(prompt);
    });

    if (typeof result === 'string') {
      if (!result.startsWith("No changes") && !result.startsWith("Error")) {
        yield* streamLLMResponse(llm, result);
      } else {
        yield result;
      }
    } else {
      yield "Error: Unexpected result type";
    }
  },
};

export const reviewLastCommitCommand: SlashCommand = {
  "name": "review-last-commit",
  "description": "Review last commit for code quality and issues",
  "run": async function* ({ llm }) {
    const result = yield* handleReviewError(async () => {
      const repo = await getGitRepo();
      if (!repo) {
        return "Error: Git repository not found";
      }

      const lastCommit = await repo.repository.getLastCommit();
      if (!lastCommit) {
        return "Error: No commits found in the repository";
      }

      let diffContent = await getDiffContent(repo, { ref1: lastCommit });
      
      // Ensure diffContent is a string and handle null/undefined
      diffContent = diffContent != null ? String(diffContent) : "";
      
      if (!diffContent) {
        return "No changes found in the last commit.";
      }

      const prompt = WORKING_STATE_PROMPT(diffContent);
      return typeof prompt === 'string' ? prompt : String(prompt);
    });

    if (typeof result === 'string') {
      if (!result.startsWith("No changes") && !result.startsWith("Error")) {
        yield* streamLLMResponse(llm, result);
      } else {
        yield result;
      }
    } else {
      yield "Error: Unexpected result type";
    }
  },
};
