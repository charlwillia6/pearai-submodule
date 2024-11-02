// gui/src/util/llmClient.ts
import { useContext } from "react";
import { IdeMessengerContext } from "../context/IdeMessenger";

export interface LLMResponse {
  content: string;
  role: "assistant";
}

export function useLLM() {
  const ideMessenger = useContext(IdeMessengerContext);

  const getLLMResponse = async (
    prompt: string,
    model: string,
  ): Promise<LLMResponse> => {
    try {      
      const response = await ideMessenger.request("llm/complete", {
        prompt,
        completionOptions: {
          model,
          temperature: 0.7,
          maxTokens: 100,
          stream: false
        },
        title: "Predictive Completion"
      });

      // Parse the response
      if (typeof response === 'string') {
        // Remove quotes if present
        const cleaned = response.replace(/^"|"$/g, '');
        // Remove the initial part that matches the input
        const inputPrefix = "I need to try to ";
        const completion = cleaned.startsWith(inputPrefix) 
          ? cleaned.slice(inputPrefix.length)
          : cleaned;
          
        return {
          content: completion,
          role: 'assistant'
        };
      }

      return {
        content: '',
        role: 'assistant'
      };
    } catch (error) {
      console.error("LLM request error:", error);
      throw error;
    }
  };

  return { getLLMResponse };
}
