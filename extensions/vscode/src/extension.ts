/**
 * This is the entry point for the extension.
 *
 * Note: This file has been significantly modified from its original contents. pearai-submodule is a fork of Continue (https://github.com/continuedev/continue).
 */

import { setupCa } from "core/util/ca";
import { Telemetry } from "core/util/posthog";
import * as vscode from "vscode";
import { getExtensionVersion } from "./util/util";
import { TabAutocompleteState } from "core";
import { GlobalContext } from "core/util/GlobalContext";

interface PearAIExtensionAPI {
  getTabAutocompleteState: () => Promise<TabAutocompleteState>;
}

async function dynamicImportAndActivate(context: vscode.ExtensionContext) {
  const { activateExtension } = await import("./activation/activate");
  try {
    return activateExtension(context);
  } catch (e) {
    console.log("Error activating extension: ", e);
    vscode.window
      .showInformationMessage(
        "Error activating the PearAI extension.",
        "View Logs",
        "Retry",
      )
      .then((selection) => {
        if (selection === "View Logs") {
          vscode.commands.executeCommand("pearai.viewLogs");
        } else if (selection === "Retry") {
          // Reload VS Code window
          vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      });
  }
}

export async function activate(context: vscode.ExtensionContext): Promise<PearAIExtensionAPI> {
  await setupCa();
  await dynamicImportAndActivate(context);

  const api: PearAIExtensionAPI = {
    getTabAutocompleteState: async () => {
      const globalContext = new GlobalContext();
      const selectedModel = globalContext.get("selectedTabAutocompleteModel");

      return {
        selectedModel: selectedModel || undefined,
        isEnabled: true
      };
    }
  };

  // Register command to expose the API method
  context.subscriptions.push(
    vscode.commands.registerCommand("pearai.getTabAutocompleteState", () => api.getTabAutocompleteState())
  );

  // Handle webview messages for tab autocomplete state
  context.subscriptions.push(
    vscode.window.registerWebviewPanelSerializer("pearai-webview", {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
        webviewPanel.webview.onDidReceiveMessage(async (message) => {
          if (message.command === "getTabAutocompleteState") {
            const state = await api.getTabAutocompleteState();

            webviewPanel.webview.postMessage({
              command: "updateTabAutocompleteState",
              state
            });
          }
        });
      }
    })
  );

  return api;
}

export function deactivate() {
  Telemetry.capture(
    "deactivate",
    {
      extensionVersion: getExtensionVersion(),
    },
    true,
  );

  Telemetry.shutdownPosthogClient();
}
