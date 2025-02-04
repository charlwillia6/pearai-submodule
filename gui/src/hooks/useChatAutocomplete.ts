import { Editor } from "@tiptap/react";
import { useCallback, useEffect, useState, useContext } from "react";
import { getTemplateForModel } from "core/autocomplete/templates";
import debounce from "lodash/debounce";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ModelDescription } from "core";
import { IdeMessengerContext } from "../context/IdeMessenger";

interface UseChatAutocompleteProps {
  editor: Editor | null;
  model: ModelDescription | undefined;
  enabled: boolean;
}

interface UseChatAutocompleteResult {
  suggestions: string[];
  isLoading: boolean;
  handleAcceptSuggestion: (suggestion: string) => void;
  dismissSuggestion: () => void;
}

interface CompletionOptions {
  model: string;
  maxTokens: number;
  temperature: number;
  stop: string[];
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
}

function parseSuggestions(completion: string): string[] {
  try {
    if (!completion || typeof completion !== 'string') {
      return [];
    }

    const lines = completion.split('\n');
    const suggestions: string[] = [];

    let currentSuggestion = '';
    let inCodeBlock = false;

    for (const line of lines) {
      // Handle numbered suggestions with or without code blocks
      const suggestionMatch = line.match(/^\s*\d+\.\s*"(.+)"$/);
      const codeBlockStart = line.trim().startsWith('```');
      
      if (suggestionMatch && !inCodeBlock) {
        // Regular suggestion line
        if (currentSuggestion) {
          suggestions.push(currentSuggestion);
          currentSuggestion = '';
        }

        suggestions.push(suggestionMatch[1]);
      } else if (codeBlockStart) {
        // Toggle code block state
        inCodeBlock = !inCodeBlock;

        if (!inCodeBlock && currentSuggestion) {
          suggestions.push(currentSuggestion);
          currentSuggestion = '';
        }
      } else if (inCodeBlock) {
        // Inside code block, accumulate content
        if (currentSuggestion) {
          currentSuggestion += '\n';
        }

        currentSuggestion += line;
      }
    }

    // Add any remaining suggestion
    if (currentSuggestion) {
      suggestions.push(currentSuggestion);
    }

    return suggestions;
  } catch (error) {
    console.error('Error parsing suggestions:', error);
    return [];
  }
}

export function useChatAutocomplete({
  editor,
  model,
  enabled
}: UseChatAutocompleteProps): UseChatAutocompleteResult {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const ideMessenger = useContext(IdeMessengerContext);
  const chatHistory = useSelector((state: RootState) => state.state.history);

  // Clear suggestions when editor content changes
  useEffect(() => {
    if (!editor) {
      return;
    }

    const updateHandler = (e: any) => {
      // Only fetch suggestions if this was a user input event
      if (e.transaction.getMeta('suggestionsUpdate')) {
        return;
      }

      const content = editor.getText();

      fetchSuggestions(content);
    };

    editor.on('update', updateHandler);

    return () => {
      editor.off('update', updateHandler);
    };
  }, [editor, model?.model, enabled]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      fetchSuggestions.cancel();
    };
  }, []);

  const fetchSuggestions = useCallback(
    debounce(async (content: string) => {
      if (!enabled || !model || !content) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // Get and validate the template for the model
        const template = getTemplateForModel(model.model);

        if (!template || !template.template) {
          throw new Error(`No template found for model ${model.model}`);
        }

        // Include chat history context in the prompt
        const recentMessages = chatHistory
          .slice(-5)
          .map(item => `${item.message.role}: ${item.message.content}`)
          .join("\n");

        // Create chat-specific prompt
        const chatPrompt = `You are a helpful chat assistant. Based on the conversation history and current input, suggest 3-5 possible completions for what the user might type next. Format your response as a numbered list with each suggestion in quotes.

Recent conversation:
${recentMessages}

Current input: "${content}"

Provide 3-5 suggestions for completing this input. Format exactly like this example:
1. "suggested completion one"
2. "suggested completion two"
3. "suggested completion three"`;

        // Get completion from the model using protocol
        const completion = await ideMessenger.request("llm/complete", {
          prompt: chatPrompt,
          completionOptions: {
            ...template.completionOptions,  // Use template's completion options
          },
          title: model.title
        });
        // Parse the suggestions from the completion
        const parsedSuggestions = parseSuggestions(completion);
        setSuggestions(parsedSuggestions);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error generating suggestions:", {
            message: error.message,
            model: model.model,
            contentLength: content.length
          });
        } else {
          console.error("Unknown error generating suggestions:", error);
        }
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 200), // Reduced debounce time for faster response
    [model, enabled, chatHistory]
  );

  const handleAcceptSuggestion = useCallback((suggestion: string) => {
    if (!editor) {
      return;
    }

    const { from } = editor.state.selection;

    editor.commands.insertContentAt(from, suggestion);
    setSuggestions([]);
  }, [editor]);

  const dismissSuggestion = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    handleAcceptSuggestion,
    dismissSuggestion
  };
}
