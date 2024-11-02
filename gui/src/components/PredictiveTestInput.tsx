// gui/src/components/PredictiveTextInput.tsx
import React, { useState, useEffect, useRef } from "react";
import { JSONContent } from "@tiptap/react";
import ContinueInputBox from "./mainInput/ContinueInputBox";
import { usePredictiveCompletion } from "../util/predictiveCompletion";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { ContextItemWithId, InputModifiers } from "core";

interface PredictiveTextInputProps {
  isLastUserInput: boolean;
  isMainInput?: boolean;
  onEnter: (editorState: JSONContent, modifiers: InputModifiers) => void;
  editorState?: JSONContent;
  contextItems?: ContextItemWithId[];
  hidden?: boolean;
  source?: "perplexity" | "aider" | "continue";
}

const PredictiveTextInput: React.FC<PredictiveTextInputProps> = (props) => {
  const { getPrediction } = usePredictiveCompletion();
  const [prediction, setPrediction] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastTextRef = useRef<string>("");
  
  const active = useSelector((store: RootState) => 
    props.source === "perplexity" ? store.state.perplexityActive :
    props.source === "aider" ? store.state.aiderActive :
    store.state.active
  );

  useEffect(() => {
    if (active) return;
  
    const updatePrediction = async (text: string) => {
      // Clear prediction if text is empty
      if (!text || text.trim().length === 0) {
        setPrediction("");
        lastTextRef.current = "";
        return;
      }
  
      // Don't predict if text is too short or hasn't changed
      if (text.length <= 5 || text === lastTextRef.current) return;
      
      const completion = await getPrediction(text);
      // Only update if the completion is different and not empty
      if (completion && completion !== prediction) {
        setPrediction(completion);
        lastTextRef.current = text;
      }
    };
  
    const observer = new MutationObserver(() => {
      const editorContent = document.querySelector(".ProseMirror");
      if (!editorContent) return;
      
      const text = editorContent.textContent || "";
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
  
      // Immediately clear prediction if text is empty
      if (!text || text.trim().length === 0) {
        setPrediction("");
        lastTextRef.current = "";
        return;
      }
  
      // Set new timeout for prediction
      timeoutRef.current = setTimeout(() => {
        updatePrediction(text);
      }, 500);
    });
  
    const editorContainer = document.querySelector(".predictive-text-input");
    if (editorContainer) {
      observer.observe(editorContainer, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  
    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [active, getPrediction, prediction]);
  

  // Clear prediction when active changes
  useEffect(() => {
    if (active) {
      setPrediction("");
      lastTextRef.current = "";
    }
  }, [active]);

  return (
    <div className="predictive-text-input" style={{ position: "relative" }}>
      <ContinueInputBox 
        {...props} 
        predictiveCompletion={prediction}
      />
    </div>
  );
};

export default PredictiveTextInput;
