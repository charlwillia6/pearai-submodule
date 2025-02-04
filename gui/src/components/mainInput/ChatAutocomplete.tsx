import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { useChatAutocomplete } from "../../hooks/useChatAutocomplete";
import { useTabAutocomplete } from "../../hooks/useTabAutocomplete";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const suggestionPluginKey = new PluginKey('suggestions');

export interface ChatAutocompleteProps {
  editor: Editor | null;
}

export function ChatAutocomplete({ editor }: ChatAutocompleteProps) {
  const { selectedModel, isEnabled: isTabAutocompleteEnabled } = useTabAutocomplete();
  const isEnabled = isTabAutocompleteEnabled && !!editor;
  const [selectedIndex, setSelectedIndex] = useState(0);

  const {
    suggestions,
    isLoading,
    handleAcceptSuggestion,
    dismissSuggestion
  } = useChatAutocomplete({
    editor,
    model: selectedModel,
    enabled: isEnabled
  });

  useEffect(() => {
    if (!editor) return;

    const suggestionPlugin = new Plugin({
      key: suggestionPluginKey,
      props: {
        decorations(state) {
          return suggestionPluginKey.getState(state);
        },
      },
      state: {
        init() {
          return DecorationSet.empty;
        },
        apply(tr, set) {
          set = set.map(tr.mapping, tr.doc);
          const action = tr.getMeta(suggestionPluginKey);
          if (action) {
            return action;
          }
          return set;
        },
      },
    });

    editor.registerPlugin(suggestionPlugin);
    return () => editor.unregisterPlugin(suggestionPluginKey);
  }, [editor]);

  // Handle keyboard navigation and suggestion acceptance
  useEffect(() => {
    if (!editor || !isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!suggestions?.length) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'ArrowRight':
            event.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
            break;
          case 'ArrowLeft':
            event.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
            break;
        }
      } else {
        switch (event.key) {
          case 'Tab':
            if (suggestions[selectedIndex]) {
              event.preventDefault();
              const suggestion = suggestions[selectedIndex];
              const pos = editor.state.selection.from;
              const text = editor.state.doc.textBetween(0, pos);
              
              // Clear decoration first
              const tr = editor.state.tr.setMeta(suggestionPluginKey, DecorationSet.empty);
              
              // Let handleAcceptSuggestion handle the text insertion
              editor.view.dispatch(tr);
              handleAcceptSuggestion(suggestion);
            }
            break;
          case 'Escape':
            event.preventDefault();
            if (editor) {
              editor.view.dispatch(editor.state.tr.setMeta(suggestionPluginKey, DecorationSet.empty));
            }
            dismissSuggestion();
            break;
        }
      }
    };

    editor.view.dom.addEventListener('keydown', handleKeyDown);

    return () => {
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, isEnabled, suggestions, selectedIndex, handleAcceptSuggestion, dismissSuggestion]);

  // Display suggestion preview
  useEffect(() => {
    if (!editor || !suggestions?.length || isLoading || !isEnabled) {
      if (editor) {
        editor.view.dispatch(editor.state.tr.setMeta(suggestionPluginKey, DecorationSet.empty));
      }

      return;
    }

    const suggestion = suggestions[selectedIndex];
    const pos = editor.state.selection.from;
    const text = editor.state.doc.textBetween(0, pos);
    const needsSpace = text.length > 0 && !text.endsWith(' ') && !suggestion.startsWith(' ');
    const previewText = needsSpace ? ' ' + suggestion : suggestion;

    const decoration = Decoration.widget(pos, () => {
      const span = document.createElement('span');
      span.className = 'suggestion-preview';
      span.style.opacity = '0.5';
      span.style.color = 'inherit';
      span.style.display = 'inline';
      span.style.pointerEvents = 'none';
      span.textContent = previewText;
      return span;
    }, { side: 1 });

    editor.view.dispatch(editor.state.tr.setMeta(suggestionPluginKey, DecorationSet.create(editor.state.doc, [decoration])));

    return () => {
      if (editor) {
        editor.view.dispatch(editor.state.tr.setMeta(suggestionPluginKey, DecorationSet.empty));
      }
    };
  }, [editor, suggestions, selectedIndex, isLoading, isEnabled]);

  return null;
}
