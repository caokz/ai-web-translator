export type ModelType = 'deepseek' | 'kimi' | 'qwen' | 'wenxin' | 'openai';

export interface ModelConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  // For Wenxin specifically
  secretKey?: string;
  accessToken?: string;
  tokenExpires?: number;
}

export interface Settings {
  activeModel: ModelType;
  models: Record<ModelType, ModelConfig>;
  translation: {
    enabled: boolean;
    showOriginal: boolean;
    autoTranslate: boolean;
    excludeTags: string[];
  };
  shortcuts: {
    toggleTranslation: string;
    extractContent: string;
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
  };
}

export interface CacheItem {
  original: string;
  translation: string;
  cachedAt: number;
}

export interface Cache {
  translations: Record<string, Record<string, CacheItem>>;
  metadata: {
    lastCleared: number;
    totalSize: number;
  };
}

export interface StorageData {
  settings: Settings;
  cache: Cache;
}

export const DEFAULT_SETTINGS: Settings = {
  activeModel: 'deepseek',
  models: {
    deepseek: {
      apiKey: '',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 1000
    },
    kimi: {
      apiKey: '',
      baseUrl: 'https://api.moonshot.cn',
      model: 'moonshot-v1-8k',
      temperature: 0.7,
      maxTokens: 1000
    },
    qwen: {
      apiKey: '',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode',
      model: 'qwen-turbo',
      temperature: 0.7,
      maxTokens: 1000
    },
    wenxin: {
      apiKey: '',
      secretKey: '',
      accessToken: '',
      tokenExpires: 0
    },
    openai: {
      apiKey: '',
      baseUrl: 'https://api.openai.com',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000
    }
  },
  translation: {
    enabled: false,
    showOriginal: true,
    autoTranslate: false,
    excludeTags: ['code', 'pre', 'script', 'style', 'textarea']
  },
  shortcuts: {
    toggleTranslation: 'Alt+T',
    extractContent: 'Alt+E'
  },
  ui: {
    theme: 'system',
    fontSize: 14
  }
};

export const DEFAULT_CACHE: Cache = {
  translations: {},
  metadata: {
    lastCleared: Date.now(),
    totalSize: 0
  }
};
