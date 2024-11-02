// gui/src/util/predictiveCompletion.ts
import { useLLM } from "./llmClient";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

// gui/src/util/predictiveCompletion.ts
export function usePredictiveCompletion() {
  const { getLLMResponse } = useLLM();
  const models = useSelector((state: RootState) => state.state.config.models);

  const getPrediction = async (inputText: string): Promise<string> => {
    try {
      const haikuModel = models.find(m => 
        m.title === "Claude 3 Haiku (PearAI)" && 
        m.provider === "pearai_server"
      );
  
      if (!haikuModel || !inputText.trim()) {
        return "";
      }
  
      // Add space handling logic
      const needsSpace = !inputText.endsWith(' ');
      const prompt = `Given the start of a sentence: "${inputText}", provide ONLY the natural completion. Do not repeat the input, do not add quotes, do not explain. Just the completion text.`;
      
      const response = await getLLMResponse(prompt, haikuModel.model);
      
      // Add space if needed before the completion
      let completion = response.content?.trim() || "";
      if (needsSpace && completion && !completion.startsWith(' ')) {
        completion = ' ' + completion;
      }
      
      return completion;
    } catch (error) {
      console.error("Error fetching prediction:", error);
      return "";
    }
  };

  return { getPrediction };
}
