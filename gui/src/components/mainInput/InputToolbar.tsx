import {
  PhotoIcon as OutlinePhotoIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { PhotoIcon as SolidPhotoIcon } from "@heroicons/react/24/solid";
import { InputModifiers } from "core";
import { modelSupportsImages } from "core/llm/autodetect";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import {
  defaultBorderRadius,
  lightGray,
  vscBadgeBackground,
  vscBadgeForeground,
  vscForeground,
  vscInputBackground,
} from "..";
import { selectUseActiveFile } from "../../redux/selectors";
import { defaultModelSelector } from "../../redux/selectors/modelSelectors";
import {
  getAltKeyLabel,
  getFontSize,
  getMetaKeyLabel,
  isMetaEquivalentKeyPressed,
} from "../../util";
import ModelSelect from "../modelSelection/ModelSelect";
import { isBareChatMode, isPerplexityMode, isAiderMode} from "../../util/bareChatMode";
import { setDefaultModel } from "../../redux/slices/stateSlice";
import { RootState } from "@/redux/store";
import { useLocation } from "react-router-dom";

const StyledDiv = styled.div<{ isHidden: boolean }>`
  padding: 4px 0;
  display: flex;
  gap: 4px;
  background-color: ${vscInputBackground};
  align-items: center;
  z-index: 50;
  font-size: ${getFontSize() - 2}px;
  cursor: ${(props) => (props.isHidden ? "default" : "text")};
  opacity: ${(props) => (props.isHidden ? 0 : 1)};
  pointer-events: ${(props) => (props.isHidden ? "none" : "auto")};
  width: 100%;

  /* Left side - keep compact */
  & > span:first-child {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 0 0 auto;
    white-space: nowrap;
    min-width: fit-content;
  }

  /* Right side container - only wrap when truly needed */
  & > span:last-child {
    display: flex;
    gap: 4px;
    align-items: center;
    margin-left: auto;
    flex: 0 1 auto;
    
    @media (max-width: 440px) {
      width: 100%;
      justify-content: flex-start; // Change from flex-end to flex-start
      margin-top: 4px;
    }
  }

  @media (max-width: 440px) {
    flex-wrap: wrap;
  }
`;

const ActionButtonsContainer = styled.span`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;
  min-width: fit-content;
`;

const ModelSelectContainer = styled.span`
  display: flex;
  align-items: center;
  white-space: nowrap;
  min-width: fit-content;
  max-width: 150px;

  /* Only truncate the text, not the whole dropdown */
  & > div > button > span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const StyledSpan = styled.span`
  font-size: ${() => `${getFontSize() - 2}px`};
  color: ${lightGray};
  white-space: nowrap;
  flex-shrink: 0;
`;

const EnterButton = styled.div<{ offFocus: boolean }>`
  padding: 2px 4px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  flex-shrink: 0;
  background-color: ${(props) =>
    props.offFocus ? undefined : lightGray + "33"};
  border-radius: ${defaultBorderRadius};
  color: ${vscForeground};

  &:hover {
    background-color: ${vscBadgeBackground};
    color: ${vscBadgeForeground};
  }

  cursor: pointer;
`;

interface InputToolbarProps {
  onEnter?: (modifiers: InputModifiers) => void;
  usingCodebase?: boolean;
  onAddContextItem?: () => void;
  onClick?: () => void;
  onImageFileSelected?: (file: File) => void;
  hidden?: boolean;
  showNoContext: boolean;
  editorHasContent: boolean;
}

const InputToolbar = (props: InputToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileSelectHovered, setFileSelectHovered] = useState(false);
  const defaultModel = useSelector(defaultModelSelector);
  const bareChatMode = isBareChatMode();
  const perplexityMode = isPerplexityMode();
  const aiderMode = isAiderMode();

  const useActiveFile = useSelector(selectUseActiveFile);
  const allModels = useSelector(
    (state: RootState) => state.state.config.models,
  );

  const dispatch = useDispatch();
  const location = useLocation();
  
  const indexingState = useSelector(
    (state: RootState) => state.state.indexingState,
  );

  const isCodebaseButtonEnabled = useMemo(() => {
    return props.editorHasContent && indexingState.status === "done";
  }, [props.editorHasContent, indexingState.status]);

  const handleCodebaseClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isCodebaseButtonEnabled) return;

      props.onAddContextItem?.();

      props.onEnter?.({
        useCodebase: true,
        noContext: !useActiveFile,
      });
    },
    [
      isCodebaseButtonEnabled,
      props.onAddContextItem,
      props.onEnter,
      useActiveFile,
    ],
  );

  useEffect(() => {
    if (location.pathname.split("/").pop() === "aiderMode") {
      const aider = allModels.find((model) =>
        model?.title?.toLowerCase().includes("aider"),
      );
      dispatch(setDefaultModel({ title: aider?.title }));
    } else if (location.pathname.split("/").pop() === "perplexityMode") {
      const perplexity = allModels.find((model) =>
        model?.title?.toLowerCase().includes("perplexity"),
      );
      dispatch(setDefaultModel({ title: perplexity?.title }));
    }
  }, [location, allModels]);

  return (
    <>
      <StyledDiv
        isHidden={props.hidden}
        onClick={props.onClick}
        id="input-toolbar"
      >
        <span className="flex gap-2 items-center whitespace-nowrap">
            <>
              {!aiderMode && !perplexityMode && <ModelSelect />}
              <StyledSpan
                onClick={(e) => {
                  props.onAddContextItem();
                }}
                className="hover:underline cursor-pointer"
                title="Add Context"
                style={{ transform: "translateY(2px)" }}
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
              </StyledSpan>
            </>
          {defaultModel &&
            modelSupportsImages(
              defaultModel.provider,
              defaultModel.model,
              defaultModel.title,
              defaultModel.capabilities,
            ) && (
              <span
                className="ml-1 mt-0.5 cursor-pointer"
                onMouseLeave={() => setFileSelectHovered(false)}
                onMouseEnter={() => setFileSelectHovered(true)}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept=".jpg,.jpeg,.png,.gif,.svg,.webp"
                  onChange={(e) => {
                    for (const file of e.target.files) {
                      props.onImageFileSelected(file);
                    }
                  }}
                />
                {fileSelectHovered ? (
                  <SolidPhotoIcon
                    width="1.4em"
                    height="1.4em"
                    color={lightGray}
                    title="Add Image"
                    onClick={(e) => {
                      fileInputRef.current?.click();
                    }}
                  />
                ) : (
                  <OutlinePhotoIcon
                    width="1.4em"
                    height="1.4em"
                    color={lightGray}
                    title="Add Image"
                    onClick={(e) => {
                      fileInputRef.current?.click();
                    }}
                  />
                )}
              </span>
            )}
        </span>
        <ActionButtonsContainer>
          {props.showNoContext ? (
            <span
              style={{
                color: props.usingCodebase ? vscBadgeBackground : lightGray,
                backgroundColor: props.usingCodebase
                  ? lightGray + "33"
                  : undefined,
                borderRadius: defaultBorderRadius,
                padding: "2px 4px",
              }}
            >
              {getAltKeyLabel()} ⏎{" "}
              {useActiveFile ? "No context" : "Use active file"}
            </span>
          ) : !bareChatMode ? (
            <StyledSpan
              style={{
                color: isCodebaseButtonEnabled
                  ? props.usingCodebase
                    ? vscBadgeBackground
                    : lightGray
                  : lightGray + "66",
                backgroundColor: props.usingCodebase
                  ? lightGray + "33"
                  : undefined,
                borderRadius: defaultBorderRadius,
                padding: "2px 4px",
                cursor: isCodebaseButtonEnabled ? "pointer" : "not-allowed",
              }}
              onClick={handleCodebaseClick}
              className={
                isCodebaseButtonEnabled
                  ? "hover:underline cursor-pointer float-right"
                  : ""
              }
              title={
                indexingState.status === "done"
                  ? `indexing complete!`
                  : `Indexing not complete: ${indexingState.status}`
              }
            >
              {getMetaKeyLabel()} ⏎ Use codebase
            </StyledSpan>
          ) : null}
          <EnterButton
            offFocus={props.usingCodebase}
            onClick={(e) => {
              props.onEnter({
                useCodebase: isMetaEquivalentKeyPressed(e),
                noContext: useActiveFile ? e.altKey : !e.altKey,
              });
            }}
          >
            ⏎ Enter
          </EnterButton>
        </ActionButtonsContainer>
      </StyledDiv>
    </>
  );
};

export default InputToolbar;
