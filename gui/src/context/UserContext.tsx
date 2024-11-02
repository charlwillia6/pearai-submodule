// gui/src/context/UserContext.tsx
import React, { createContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { BrowserSerializedContinueConfig } from "core/config/load";

interface UserContextProps {
  isProUser: boolean;
}

export const UserContext = createContext<UserContextProps>({
  isProUser: false,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const models = useSelector((state: RootState) => state.state.config.models);
  const [isProUser, setIsProUser] = useState(false);

  useEffect(() => {
    // Debug log all models first
    console.log("UserContext - All available models:", models);

    // Look specifically for the Haiku model
    const haikuModel = models.find(m => {
      const isMatch = (
        m.title === "Claude 3 Haiku (PearAI)" && 
        m.provider === "pearai_server" &&
        m.model === "claude-3-haiku"
      );
      
      console.log("Checking model:", {
        title: m.title,
        provider: m.provider,
        model: m.model,
        isMatch: isMatch,
        titleMatch: m.title === "Claude 3 Haiku (PearAI)",
        providerMatch: m.provider === "pearai_server",
        modelMatch: m.model === "claude-3-haiku"
      });
      
      return isMatch;
    });

    console.log("UserContext - Found Haiku model:", haikuModel);

    // Look for any Claude models from pearai_server
    const claudeModels = models.filter(m => {
      const isClaudeModel = (
        m.provider === "pearai_server" && 
        (m.model.includes("claude-3") || m.model.includes("claude-3-5"))
      );
      
      console.log("Checking for Claude model:", {
        title: m.title,
        provider: m.provider,
        model: m.model,
        isClaudeModel: isClaudeModel
      });
      
      return isClaudeModel;
    });

    console.log("UserContext - All Claude models found:", claudeModels);

    // Check if we have access to any non-trial Claude models
    const hasClaudeAccess = claudeModels.some(m => {
      const hasAccess = !m.title.toLowerCase().includes("trial");
      console.log("Checking Claude model access:", {
        title: m.title,
        hasAccess: hasAccess
      });
      return hasAccess;
    });

    console.log("UserContext - Has Claude access:", hasClaudeAccess);

    // Set pro status based on having either Haiku or any Claude access
    const isPro = !!haikuModel || hasClaudeAccess;
    
    console.log("UserContext - Final pro status determination:", {
      isPro,
      haikuAvailable: !!haikuModel,
      hasClaudeAccess,
      reasonForStatus: isPro ? 
        (!!haikuModel ? "Has Haiku model" : "Has Claude access") : 
        "No pro models found"
    });

    setIsProUser(isPro);
  }, [models]);

  // Debug when the value actually changes
  useEffect(() => {
    console.log("UserContext - isProUser state updated to:", isProUser);
  }, [isProUser]);

  return (
    <UserContext.Provider value={{ isProUser }}>
      {children}
    </UserContext.Provider>
  );
};
