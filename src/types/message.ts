// Message types
export type MessageType =
  | 'TRANSLATE_PAGE'
  | 'TRANSLATE_TEXT'
  | 'EXTRACT_CONTENT'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'GET_CACHE'
  | 'SET_CACHE'
  | 'CLEAR_CACHE'
  | 'SYNC_STATE'
  | 'STATE_CHANGED'
  | 'TRIGGER_EXTRACT';

export interface Message<T = any> {
  type: MessageType;
  payload: T;
  requestId?: string;
}

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Translate messages
export interface TranslatePagePayload {
  enabled: boolean;
  tabId?: number;
}

export interface TranslateTextPayload {
  text: string;
  targetLang?: string;
  sourceUrl?: string;
}

export interface TranslateTextResponse {
  original: string;
  translation: string;
  cached: boolean;
}

// Extract messages
export interface ExtractContentPayload {
  url: string;
  title: string;
  content: string;
  options?: {
    includeImages?: boolean;
    maxLength?: number;
  };
}

export interface ExtractContentResponse {
  markdown: string;
  metadata: {
    title: string;
    wordCount: number;
    extractedAt: string;
  };
}

// Settings messages
export interface GetSettingsPayload {
  keys?: string[];
}

export interface UpdateSettingsPayload {
  [key: string]: any;
}

// State messages
export interface SyncStatePayload {
  tabId: number;
  url: string;
}

export interface SyncStateResponse {
  translationEnabled: boolean;
  activeModel: string;
}

export interface StateChangedPayload {
  translationEnabled?: boolean;
  activeModel?: string;
}
