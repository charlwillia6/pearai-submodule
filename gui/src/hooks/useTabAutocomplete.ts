import { ModelDescription, TabAutocompleteState } from "core";
import { useEffect, useState } from "react";

// VS Code webview API is available globally
declare const vscode: {
  postMessage: (message: any) => void;
};

interface TabAutocompleteHookResult {
  selectedModel: ModelDescription | undefined;
  isEnabled: boolean;
  models: ModelDescription[];
}

export function useTabAutocomplete(): TabAutocompleteHookResult {
  const [state, setState] = useState<TabAutocompleteState>({
    selectedModel: undefined,
    isEnabled: false
  });

  useEffect(() => {
    // Set up message handler
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;

      if (message.command === "updateTabAutocompleteState") {
        setState(message.state);
      }
    };

    window.addEventListener('message', messageHandler);

    vscode.postMessage({ command: "getTabAutocompleteState" });

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, []);

  return {
    selectedModel: state.selectedModel ? {
      model: state.selectedModel,
      title: state.selectedModel
    } as ModelDescription : undefined,
    isEnabled: state.isEnabled,
    models: []
  };
}
