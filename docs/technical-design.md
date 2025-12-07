# AI Web Translator - 技术设计文档

> 版本: 1.0
> 日期: 2025-12-06
> 状态: 初稿

---

## 1. 技术概述

### 1.1 项目简介
AI Web Translator 是一款基于 Chrome Extension Manifest V3 开发的浏览器插件，利用大语言模型提供网页翻译和内容提炼功能。

### 1.2 技术目标
- 高性能：翻译响应快速，不阻塞页面渲染
- 可扩展：支持快速接入新的大模型API
- 可维护：代码结构清晰，模块化设计
- 安全性：API Key加密存储，数据本地化

---

## 2. 系统架构

### 2.1 整体架构图
```
┌─────────────────────────────────────────────────────────────────┐
│                        Chrome Browser                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Chrome Extension                        │  │
│  │  ┌─────────────┬─────────────┬─────────────────────────┐  │  │
│  │  │   Popup     │   Options   │     Content Script      │  │  │
│  │  │   (React)   │   (React)   │   (Vanilla JS + CSS)    │  │  │
│  │  │             │             │                         │  │  │
│  │  │ - 翻译开关  │ - API配置   │ - DOM遍历与翻译注入     │  │  │
│  │  │ - 提炼按钮  │ - 参数设置  │ - 划词翻译监听          │  │  │
│  │  │ - 模型选择  │ - 缓存管理  │ - MutationObserver     │  │  │
│  │  └──────┬──────┴──────┬──────┴───────────┬─────────────┘  │  │
│  │         │             │                   │                │  │
│  │         └─────────────┴─────────┬─────────┘                │  │
│  │                                 │                          │  │
│  │                    Chrome Message API                      │  │
│  │                                 │                          │  │
│  │  ┌──────────────────────────────┴──────────────────────┐  │  │
│  │  │              Background Service Worker               │  │  │
│  │  │                                                      │  │  │
│  │  │  ┌────────────┬────────────┬────────────────────┐   │  │  │
│  │  │  │ Message    │ State      │ LLM Service        │   │  │  │
│  │  │  │ Router     │ Manager    │ Manager            │   │  │  │
│  │  │  └────────────┴────────────┴─────────┬──────────┘   │  │  │
│  │  │                                      │              │  │  │
│  │  └──────────────────────────────────────┼──────────────┘  │  │
│  └─────────────────────────────────────────┼─────────────────┘  │
│                                            │                    │
└────────────────────────────────────────────┼────────────────────┘
                                             │
                    ┌────────────────────────┴────────────────────┐
                    │              LLM API Layer                   │
                    │  ┌─────────┬────────┬────────┬───────────┐  │
                    │  │DeepSeek │  Kimi  │  Qwen  │  Wenxin   │  │
                    │  │   API   │   API  │   API  │    API    │  │
                    │  └─────────┴────────┴────────┴───────────┘  │
                    └──────────────────────────────────────────────┘
```

### 2.2 模块说明

| 模块 | 职责 | 运行环境 |
|------|------|----------|
| Popup | 用户交互界面，翻译控制 | 独立窗口 |
| Options | 设置页面，配置管理 | 独立标签页 |
| Content Script | DOM操作，翻译注入 | 网页上下文 |
| Service Worker | 消息路由，API调用 | 后台进程 |
| LLM Service | 大模型API封装 | Service Worker内 |

### 2.3 数据流向
```
用户操作 → Popup/Content Script
         → Chrome Message API
         → Service Worker
         → LLM API
         → Service Worker
         → Chrome Message API
         → Content Script
         → DOM更新
```

---

## 3. 目录结构

```
ai-web-translator/
├── manifest.json                 # 插件配置文件
├── package.json                  # 项目依赖
├── vite.config.js                # Vite构建配置
├── tailwind.config.js            # Tailwind CSS配置
├── tsconfig.json                 # TypeScript配置
│
├── src/
│   ├── background/               # Service Worker
│   │   ├── index.ts              # 入口文件
│   │   ├── messageRouter.ts      # 消息路由
│   │   └── stateManager.ts       # 状态管理
│   │
│   ├── content/                  # Content Script
│   │   ├── index.ts              # 入口文件
│   │   ├── translator.ts         # 页面翻译逻辑
│   │   ├── selection.ts          # 划词翻译逻辑
│   │   ├── extractor.ts          # 内容提取逻辑
│   │   └── styles.css            # 注入样式
│   │
│   ├── popup/                    # Popup页面
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── TranslateToggle.tsx
│   │       ├── ExtractButton.tsx
│   │       └── ModelSelector.tsx
│   │
│   ├── options/                  # Options页面
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── ApiConfig.tsx
│   │       ├── ModelSettings.tsx
│   │       └── CacheManager.tsx
│   │
│   ├── services/                 # 服务层
│   │   ├── llm/                  # LLM服务
│   │   │   ├── types.ts          # 类型定义
│   │   │   ├── base.ts           # 基类
│   │   │   ├── deepseek.ts       # DeepSeek实现
│   │   │   ├── kimi.ts           # Kimi实现
│   │   │   ├── openai.ts         # OpenAI兼容实现
│   │   │   ├── qwen.ts           # 通义千问实现
│   │   │   ├── wenxin.ts         # 文心一言实现
│   │   │   └── factory.ts        # 工厂方法
│   │   │
│   │   ├── translator.ts         # 翻译服务
│   │   └── contentExtractor.ts   # 内容提取服务
│   │
│   ├── utils/                    # 工具函数
│   │   ├── storage.ts            # Chrome Storage封装
│   │   ├── crypto.ts             # 加密工具
│   │   ├── markdown.ts           # Markdown生成
│   │   ├── domUtils.ts           # DOM操作工具
│   │   └── i18n.ts               # 国际化
│   │
│   ├── hooks/                    # React Hooks
│   │   ├── useStorage.ts
│   │   ├── useTranslation.ts
│   │   └── useModel.ts
│   │
│   ├── store/                    # Zustand状态管理
│   │   ├── settingsStore.ts
│   │   └── translationStore.ts
│   │
│   └── types/                    # 全局类型定义
│       ├── message.ts
│       ├── settings.ts
│       └── translation.ts
│
├── public/
│   └── icons/                    # 插件图标
│       ├── icon16.png
│       ├── icon32.png
│       ├── icon48.png
│       └── icon128.png
│
└── docs/                         # 文档
    ├── PRD.md
    ├── technical-design.md
    └── api-design.md
```

---

## 4. 技术选型

### 4.1 技术栈总览
| 类别 | 选择 | 版本 | 理由 |
|------|------|------|------|
| 语言 | TypeScript | 5.x | 类型安全，提高代码质量 |
| 构建工具 | Vite | 5.x | 快速构建，HMR支持 |
| 插件框架 | CRXJS | 2.x | Vite插件，简化开发流程 |
| UI框架 | React | 18.x | 生态成熟，组件化开发 |
| 样式方案 | Tailwind CSS | 3.x | 原子化CSS，快速开发 |
| 状态管理 | Zustand | 4.x | 轻量级，API简洁 |
| HTTP | Fetch API | - | 浏览器原生，无需额外依赖 |
| 存储 | Chrome Storage API | - | 插件标准API |

### 4.2 开发依赖
```json
{
  "devDependencies": {
    "@crxjs/vite-plugin": "^2.0.0-beta.23",
    "@types/chrome": "^0.0.260",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0"
  }
}
```

---

## 5. 核心模块设计

### 5.1 LLM服务层

#### 5.1.1 类图
```
┌─────────────────────────────────────┐
│         BaseLLMService              │
│─────────────────────────────────────│
│ # config: LLMConfig                 │
│─────────────────────────────────────│
│ + constructor(config)               │
│ + chat(messages, options): Promise  │
│ + translate(text, lang): Promise    │
│ + summarize(content): Promise       │
│ # buildHeaders(): Headers           │
│ # buildBody(messages): object       │
│ # parseResponse(response): string   │
└─────────────────────────────────────┘
              △
              │
    ┌─────────┴─────────┬─────────────┬─────────────┐
    │                   │             │             │
┌───┴───┐         ┌─────┴────┐  ┌─────┴────┐  ┌────┴─────┐
│DeepSeek│        │   Kimi   │  │   Qwen   │  │  Wenxin  │
│Service │        │  Service │  │  Service │  │  Service │
└────────┘        └──────────┘  └──────────┘  └──────────┘
```

#### 5.1.2 基类实现
```typescript
// src/services/llm/base.ts
export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export abstract class BaseLLMService {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[], options?: Partial<LLMConfig>): Promise<string> {
    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(this.buildBody(messages, options))
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  async translate(text: string, targetLang: string = 'zh-CN'): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的翻译助手。请将用户输入的内容翻译成${targetLang === 'zh-CN' ? '简体中文' : targetLang}。
要求：
1. 保持原文的格式和结构
2. 翻译要准确自然，符合目标语言的表达习惯
3. 专业术语保持准确
4. 只输出翻译结果，不要有其他解释`
      },
      { role: 'user', content: text }
    ];
    return this.chat(messages);
  }

  async summarize(content: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的内容提炼助手。请分析用户提供的内容，生成结构化的Markdown文档。
要求：
1. 提取文章标题
2. 生成200-500字的摘要
3. 列出3-5个核心观点
4. 保持原文的重要信息
5. 输出格式为Markdown`
      },
      { role: 'user', content: content }
    ];
    return this.chat(messages, { maxTokens: 2000 });
  }

  protected abstract getEndpoint(): string;
  protected abstract buildHeaders(): HeadersInit;
  protected abstract buildBody(messages: ChatMessage[], options?: Partial<LLMConfig>): object;
  protected abstract parseResponse(data: any): string;
}
```

#### 5.1.3 DeepSeek实现
```typescript
// src/services/llm/deepseek.ts
export class DeepSeekService extends BaseLLMService {
  protected getEndpoint(): string {
    return `${this.config.baseUrl || 'https://api.deepseek.com'}/v1/chat/completions`;
  }

  protected buildHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`
    };
  }

  protected buildBody(messages: ChatMessage[], options?: Partial<LLMConfig>): object {
    return {
      model: options?.model || this.config.model || 'deepseek-chat',
      messages,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 1000
    };
  }

  protected parseResponse(data: any): string {
    return data.choices[0]?.message?.content || '';
  }
}
```

#### 5.1.4 工厂模式
```typescript
// src/services/llm/factory.ts
import { BaseLLMService, LLMConfig } from './base';
import { DeepSeekService } from './deepseek';
import { KimiService } from './kimi';
import { QwenService } from './qwen';
import { WenxinService } from './wenxin';
import { OpenAIService } from './openai';

export type ModelType = 'deepseek' | 'kimi' | 'qwen' | 'wenxin' | 'openai';

export function createLLMService(type: ModelType, config: LLMConfig): BaseLLMService {
  switch (type) {
    case 'deepseek':
      return new DeepSeekService(config);
    case 'kimi':
      return new KimiService(config);
    case 'qwen':
      return new QwenService(config);
    case 'wenxin':
      return new WenxinService(config);
    case 'openai':
      return new OpenAIService(config);
    default:
      throw new Error(`Unknown model type: ${type}`);
  }
}
```

---

### 5.2 消息通信

#### 5.2.1 消息类型定义
```typescript
// src/types/message.ts
export type MessageType =
  | 'TRANSLATE_PAGE'
  | 'TRANSLATE_TEXT'
  | 'EXTRACT_CONTENT'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'CLEAR_CACHE';

export interface Message<T = any> {
  type: MessageType;
  payload: T;
  tabId?: number;
}

export interface TranslatePagePayload {
  enabled: boolean;
}

export interface TranslateTextPayload {
  text: string;
  targetLang?: string;
}

export interface ExtractContentPayload {
  url: string;
  content: string;
}
```

#### 5.2.2 消息路由
```typescript
// src/background/messageRouter.ts
import { Message, MessageType } from '../types/message';
import { translatorService } from '../services/translator';
import { contentExtractorService } from '../services/contentExtractor';

type MessageHandler = (payload: any, sender: chrome.runtime.MessageSender) => Promise<any>;

const handlers: Record<MessageType, MessageHandler> = {
  TRANSLATE_PAGE: async (payload) => {
    // 处理页面翻译请求
    return { success: true };
  },

  TRANSLATE_TEXT: async (payload) => {
    const { text, targetLang } = payload;
    const result = await translatorService.translate(text, targetLang);
    return { translation: result };
  },

  EXTRACT_CONTENT: async (payload) => {
    const { content, url } = payload;
    const result = await contentExtractorService.extract(content, url);
    return { markdown: result };
  },

  GET_SETTINGS: async () => {
    return chrome.storage.local.get('settings');
  },

  UPDATE_SETTINGS: async (payload) => {
    await chrome.storage.local.set({ settings: payload });
    return { success: true };
  },

  CLEAR_CACHE: async () => {
    await chrome.storage.local.remove('cache');
    return { success: true };
  }
};

export function initMessageRouter() {
  chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    const handler = handlers[message.type];
    if (handler) {
      handler(message.payload, sender)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true; // 保持消息通道开放
    }
  });
}
```

---

### 5.3 Content Script

#### 5.3.1 翻译注入逻辑
```typescript
// src/content/translator.ts
const SKIP_TAGS = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT'];
const TRANSLATED_ATTR = 'data-ai-translated';

export class PageTranslator {
  private enabled = false;
  private observer: MutationObserver | null = null;

  async enable() {
    if (this.enabled) return;
    this.enabled = true;

    await this.translatePage();
    this.startObserving();
  }

  disable() {
    this.enabled = false;
    this.stopObserving();
    this.removeTranslations();
  }

  private async translatePage() {
    const textNodes = this.getTextNodes(document.body);
    const batches = this.batchNodes(textNodes, 10);

    for (const batch of batches) {
      await this.translateBatch(batch);
    }
  }

  private getTextNodes(root: Element): Text[] {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (SKIP_TAGS.includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
          if (parent.hasAttribute(TRANSLATED_ATTR)) return NodeFilter.FILTER_REJECT;
          if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text)) {
      nodes.push(node);
    }
    return nodes;
  }

  private batchNodes(nodes: Text[], size: number): Text[][] {
    const batches: Text[][] = [];
    for (let i = 0; i < nodes.length; i += size) {
      batches.push(nodes.slice(i, i + size));
    }
    return batches;
  }

  private async translateBatch(nodes: Text[]) {
    const texts = nodes.map(n => n.textContent || '');
    const combined = texts.join('\n---SPLIT---\n');

    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_TEXT',
      payload: { text: combined }
    });

    if (response.translation) {
      const translations = response.translation.split('\n---SPLIT---\n');
      nodes.forEach((node, i) => {
        if (translations[i]) {
          this.insertTranslation(node, translations[i]);
        }
      });
    }
  }

  private insertTranslation(textNode: Text, translation: string) {
    const parent = textNode.parentElement;
    if (!parent) return;

    const wrapper = document.createElement('span');
    wrapper.setAttribute(TRANSLATED_ATTR, 'true');
    wrapper.className = 'ai-translation-wrapper';

    const translationEl = document.createElement('span');
    translationEl.className = 'ai-translation-text';
    translationEl.textContent = translation;

    parent.insertBefore(wrapper, textNode.nextSibling);
    wrapper.appendChild(translationEl);
  }

  private startObserving() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            this.translatePage();
          }
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private stopObserving() {
    this.observer?.disconnect();
    this.observer = null;
  }

  private removeTranslations() {
    const wrappers = document.querySelectorAll(`[${TRANSLATED_ATTR}]`);
    wrappers.forEach(el => el.remove());
  }
}
```

#### 5.3.2 划词翻译
```typescript
// src/content/selection.ts
export class SelectionTranslator {
  private bubble: HTMLElement | null = null;

  init() {
    document.addEventListener('mouseup', this.handleSelection.bind(this));
    document.addEventListener('mousedown', this.handleClickOutside.bind(this));
  }

  private async handleSelection(e: MouseEvent) {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length < 2) {
      return;
    }

    const range = selection?.getRangeAt(0);
    if (!range) return;

    const rect = range.getBoundingClientRect();
    await this.showBubble(text, {
      x: rect.left + rect.width / 2,
      y: rect.bottom + window.scrollY
    });
  }

  private async showBubble(text: string, position: { x: number; y: number }) {
    this.removeBubble();

    this.bubble = document.createElement('div');
    this.bubble.className = 'ai-selection-bubble';
    this.bubble.innerHTML = `
      <div class="ai-bubble-loading">翻译中...</div>
    `;

    this.bubble.style.left = `${position.x}px`;
    this.bubble.style.top = `${position.y + 10}px`;
    document.body.appendChild(this.bubble);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_TEXT',
        payload: { text }
      });

      if (this.bubble) {
        this.bubble.innerHTML = `
          <div class="ai-bubble-content">${response.translation}</div>
          <div class="ai-bubble-actions">
            <button class="ai-bubble-copy">复制</button>
          </div>
        `;

        this.bubble.querySelector('.ai-bubble-copy')?.addEventListener('click', () => {
          navigator.clipboard.writeText(response.translation);
        });
      }
    } catch (error) {
      if (this.bubble) {
        this.bubble.innerHTML = `<div class="ai-bubble-error">翻译失败</div>`;
      }
    }
  }

  private handleClickOutside(e: MouseEvent) {
    if (this.bubble && !this.bubble.contains(e.target as Node)) {
      this.removeBubble();
    }
  }

  private removeBubble() {
    this.bubble?.remove();
    this.bubble = null;
  }
}
```

---

### 5.4 存储设计

#### 5.4.1 存储结构
```typescript
// src/types/settings.ts
export interface ModelConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Settings {
  activeModel: string;
  models: Record<string, ModelConfig>;
  translation: {
    enabled: boolean;
    showOriginal: boolean;
    autoTranslate: boolean;
  };
  shortcuts: {
    toggleTranslation: string;
    extractContent: string;
  };
}

export interface Cache {
  translations: Record<string, Record<string, string>>; // url -> { text: translation }
  lastCleared: number;
}

export interface StorageData {
  settings: Settings;
  cache: Cache;
}
```

#### 5.4.2 存储工具类
```typescript
// src/utils/storage.ts
import { Settings, Cache, StorageData } from '../types/settings';

const DEFAULT_SETTINGS: Settings = {
  activeModel: 'deepseek',
  models: {
    deepseek: { apiKey: '', baseUrl: 'https://api.deepseek.com' },
    kimi: { apiKey: '', baseUrl: 'https://api.moonshot.cn' },
    qwen: { apiKey: '', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode' },
    wenxin: { apiKey: '', baseUrl: 'https://aip.baidubce.com' },
    openai: { apiKey: '', baseUrl: '' }
  },
  translation: {
    enabled: false,
    showOriginal: true,
    autoTranslate: false
  },
  shortcuts: {
    toggleTranslation: 'Alt+T',
    extractContent: 'Alt+E'
  }
};

export const storage = {
  async getSettings(): Promise<Settings> {
    const data = await chrome.storage.local.get('settings');
    return { ...DEFAULT_SETTINGS, ...data.settings };
  },

  async setSettings(settings: Partial<Settings>): Promise<void> {
    const current = await this.getSettings();
    await chrome.storage.local.set({
      settings: { ...current, ...settings }
    });
  },

  async getCache(): Promise<Cache> {
    const data = await chrome.storage.local.get('cache');
    return data.cache || { translations: {}, lastCleared: Date.now() };
  },

  async setTranslationCache(url: string, text: string, translation: string): Promise<void> {
    const cache = await this.getCache();
    if (!cache.translations[url]) {
      cache.translations[url] = {};
    }
    cache.translations[url][text] = translation;
    await chrome.storage.local.set({ cache });
  },

  async getTranslationCache(url: string, text: string): Promise<string | null> {
    const cache = await this.getCache();
    return cache.translations[url]?.[text] || null;
  },

  async clearCache(): Promise<void> {
    await chrome.storage.local.set({
      cache: { translations: {}, lastCleared: Date.now() }
    });
  }
};
```

---

## 6. 安全设计

### 6.1 API Key加密
```typescript
// src/utils/crypto.ts
const ENCRYPTION_KEY = 'ai-web-translator-key';

export async function encrypt(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(encryptedText: string): Promise<string> {
  const combined = new Uint8Array(
    atob(encryptedText).split('').map(c => c.charCodeAt(0))
  );

  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}
```

### 6.2 权限最小化
```json
// manifest.json permissions
{
  "permissions": [
    "storage",           // 存储设置和缓存
    "activeTab",         // 访问当前标签页
    "scripting"          // 注入Content Script
  ],
  "host_permissions": [
    "https://api.deepseek.com/*",
    "https://api.moonshot.cn/*",
    "https://dashscope.aliyuncs.com/*",
    "https://aip.baidubce.com/*"
  ]
}
```

---

## 7. 构建配置

### 7.1 Vite配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html'
      }
    }
  }
});
```

### 7.2 Manifest V3配置
```json
// manifest.json
{
  "manifest_version": 3,
  "name": "AI Web Translator",
  "version": "1.0.0",
  "description": "智能网页翻译与内容提炼助手",

  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": {
      "16": "public/icons/icon16.png",
      "32": "public/icons/icon32.png",
      "48": "public/icons/icon48.png",
      "128": "public/icons/icon128.png"
    }
  },

  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/index.ts"],
      "css": ["src/content/styles.css"]
    }
  ],

  "options_page": "src/options/index.html",

  "commands": {
    "toggle-translation": {
      "suggested_key": {
        "default": "Alt+T"
      },
      "description": "开启/关闭页面翻译"
    },
    "extract-content": {
      "suggested_key": {
        "default": "Alt+E"
      },
      "description": "提炼当前页面内容"
    }
  },

  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],

  "host_permissions": [
    "https://api.deepseek.com/*",
    "https://api.moonshot.cn/*",
    "https://dashscope.aliyuncs.com/*",
    "https://aip.baidubce.com/*"
  ]
}
```

---

## 8. 测试策略

### 8.1 单元测试
- LLM服务层测试
- 工具函数测试
- 存储操作测试

### 8.2 集成测试
- 消息通信测试
- Content Script注入测试
- 翻译流程测试

### 8.3 E2E测试
- 使用Puppeteer进行端到端测试
- 测试完整用户流程

---

## 9. 部署流程

### 9.1 开发环境
```bash
# 安装依赖
npm install

# 启动开发服务
npm run dev

# Chrome加载扩展
# 1. 打开 chrome://extensions/
# 2. 开启"开发者模式"
# 3. 点击"加载已解压的扩展程序"
# 4. 选择 dist 目录
```

### 9.2 生产构建
```bash
# 构建生产版本
npm run build

# 输出目录: dist/
# 可直接打包为.crx或提交到Chrome Web Store
```

---

## 10. 附录

### 10.1 参考文档
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Vite Documentation](https://vitejs.dev/)
- [CRXJS Vite Plugin](https://crxjs.dev/vite-plugin/)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
