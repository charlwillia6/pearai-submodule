import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { defaultModelSelector } from '../redux/selectors/modelSelectors'; // Adjust this import path as needed
import { useLocation } from 'react-router-dom';


const BARE_CHAT_PATHS = ['/aiderMode'];

export function isBareChatMode() {
  const location = useLocation();
  return BARE_CHAT_PATHS.includes(location?.pathname);
}


export function isPerplexityMode() {
  const defaultModel = useSelector(defaultModelSelector);

  return useMemo(
    () => defaultModel?.model?.toLowerCase().includes("perplexity"),
    [defaultModel]
  );
}
