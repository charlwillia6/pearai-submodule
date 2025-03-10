"use client";

import { Button } from "@/components/ui/button";
import { IdeMessengerContext } from "@/context/IdeMessenger";
import { getLocalStorage, setLocalStorage } from "@/util/localStorage";
import { ArrowLongRightIcon } from "@heroicons/react/24/outline";
import { useContext, useEffect, useState } from "react";

export const getLogoPath = (assetName: string) => {
  return `${window.vscMediaUrl}/logos/${assetName}`;
};

export default function ImportExtensions({ onNext }: { onNext: () => void }) {
  const [isImporting, setIsImporting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [importError, setImportError] = useState("");
  const [showSkip, setShowSkip] = useState(true);

  const ideMessenger = useContext(IdeMessengerContext);

  const handleImport = async () => {
    setIsImporting(true);
    setImportError("");

    // Wait for 30 seconds to show the skip button
    setShowSkip(false);
    setTimeout(() => setShowSkip(true), 30000);

    // Attempt to load settings
    const settingsLoaded = await ideMessenger.request(
      "importUserSettingsFromVSCode",
      undefined,
    );
    if (typeof settingsLoaded === "boolean" && settingsLoaded) {
      setIsDone(true);
      setLocalStorage("isDoneImportingUserSettingsFromVSCode", true);
      onNext();
    } else {
      setIsImporting(false);
      setIsDone(false);
      setImportError(
        "Something went wrong while importing your settings. Please skip or try again.",
      );
    }
  };

  const handleSkip = () => {
    setIsImporting(false);
    setIsDone(false);
    onNext();
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !isImporting) {
        handleImport();
      } else if ((event.metaKey || event.ctrlKey) && event.key === "ArrowRight" && !isImporting) {
        event.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isImporting]); // Include isImporting in dependencies to prevent import when already in progress

  useEffect(() => {
    // If user presses back, we want the screen to still say "done"
    setIsDone(getLocalStorage("isDoneImportingUserSettingsFromVSCode") === true);
  }, [isDone])

  return (
    <div className="flex w-full overflow-hidden bg-background text-foreground">
      <div className="w-full flex flex-col h-screen">
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 lg:p-10">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-6 text-center">
            Import your extensions <br /> and user settings from VSCode
          </h2>
          <div className="flex items-center justify-center gap-8 mb-8">
            <img src={getLogoPath("vscode.svg")} className="w-[100px] h-[100px]" alt="VS Code" />
              <ArrowLongRightIcon className="w-8 h-8 text-muted-foreground" />
            <img src={getLogoPath("pearai-green.svg")} className="w-36 h-36 ml-[-2.5rem]" alt="PearAI" />
          </div>

          {!isDone ? (
            <div>
              {importError ? <p>{importError}</p> : null}
              <div className="absolute bottom-8 right-8 flex items-center gap-4">
                {showSkip && (
                  <div onClick={handleSkip} className="flex items-center gap-2 cursor-pointer">
                    <span className="text-center w-full">Skip</span>
                  </div>
                )}
                <Button
                  disabled={isImporting}
                  className="w-[250px] text-button-foreground bg-button hover:bg-button-hover p-4 lg:py-6 lg:px-2 text-sm md:text-base cursor-pointer transition-all duration-300"
                  onClick={handleImport}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    {isImporting ? (
                      <div className="flex items-center justify-center w-full gap-2">
                        <svg
                          className="animate-spin h-5 w-5 text-button-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Importing...</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-center w-full">Import</span>
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 mb-24">
              <div>Done importing! You can leave this page</div>
              <div onClick={onNext} className="flex items-center gap-2 cursor-pointer"
              >
                <span className="text-center w-full">Continue</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
