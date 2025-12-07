# AI Web Translator - API接口设计文档

> 版本: 1.0
> 日期: 2025-12-06
> 状态: 初稿

---

## 1. 概述

本文档定义了 AI Web Translator 插件的所有接口规范，包括：
- 大模型API适配规范
- 插件内部消息通信协议
- Chrome Storage存储结构

---

## 2. 大模型API适配

### 2.1 支持的模型列表

| 模型 | 厂商 | API风格 | 官方文档 |
|------|------|---------|----------|
| DeepSeek | 深度求索 | OpenAI兼容 | [docs](https://platform.deepseek.com/api-docs/) |
| Kimi | 月之暗面 | OpenAI兼容 | [docs](https://platform.moonshot.cn/docs/) |
| 通义千问 | 阿里云 | OpenAI兼容 | [docs](https://help.aliyun.com/zh/dashscope/) |
| 文心一言 | 百度 | 自有格式 | [docs](https://cloud.baidu.com/doc/WENXINWORKSHOP/) |
| OpenAI兼容 | - | OpenAI标准 | [docs](https://platform.openai.com/docs/) |

---

### 2.2 DeepSeek API

#### 2.2.1 基本信息
| 属性 | 值 |
|------|-----|
| Base URL | `https://api.deepseek.com` |
| API版本 | v1 |
| 认证方式 | Bearer Token |

#### 2.2.2 Chat Completions
**Endpoint:** `POST /v1/chat/completions`

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer {api_key}
```

**Request Body:**
```json
{
  "model": "deepseek-chat",
  "messages": [
    {
      "role": "system",
      "content": "你是一个翻译助手"
    },
    {
      "role": "user",
      "content": "Hello, world!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

**Response:**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "deepseek-chat",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "你好，世界！"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  }
}
```

**可用模型:**
| Model ID | 说明 | 上下文长度 |
|----------|------|------------|
| deepseek-chat | 通用对话模型 | 32K |
| deepseek-coder | 代码专用模型 | 16K |

---

### 2.3 Kimi (月之暗面) API

#### 2.3.1 基本信息
| 属性 | 值 |
|------|-----|
| Base URL | `https://api.moonshot.cn` |
| API版本 | v1 |
| 认证方式 | Bearer Token |

#### 2.3.2 Chat Completions
**Endpoint:** `POST /v1/chat/completions`

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer {api_key}
```

**Request Body:**
```json
{
  "model": "moonshot-v1-8k",
  "messages": [
    {
      "role": "system",
      "content": "你是一个翻译助手"
    },
    {
      "role": "user",
      "content": "Hello, world!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response:** (与DeepSeek格式相同)

**可用模型:**
| Model ID | 说明 | 上下文长度 |
|----------|------|------------|
| moonshot-v1-8k | 8K上下文 | 8K |
| moonshot-v1-32k | 32K上下文 | 32K |
| moonshot-v1-128k | 128K上下文 | 128K |

---

### 2.4 通义千问 API

#### 2.4.1 基本信息
| 属性 | 值 |
|------|-----|
| Base URL | `https://dashscope.aliyuncs.com/compatible-mode` |
| API版本 | v1 |
| 认证方式 | Bearer Token |

#### 2.4.2 Chat Completions
**Endpoint:** `POST /v1/chat/completions`

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer {api_key}
```

**Request Body:**
```json
{
  "model": "qwen-turbo",
  "messages": [
    {
      "role": "system",
      "content": "你是一个翻译助手"
    },
    {
      "role": "user",
      "content": "Hello, world!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**可用模型:**
| Model ID | 说明 | 上下文长度 |
|----------|------|------------|
| qwen-turbo | 快速响应 | 8K |
| qwen-plus | 增强版本 | 32K |
| qwen-max | 最强版本 | 8K |
| qwen-max-longcontext | 长上下文 | 28K |

---

### 2.5 文心一言 API

#### 2.5.1 基本信息
| 属性 | 值 |
|------|-----|
| Base URL | `https://aip.baidubce.com` |
| 认证方式 | Access Token |

#### 2.5.2 获取Access Token
**Endpoint:** `POST /oauth/2.0/token`

**Request:**
```http
POST /oauth/2.0/token?grant_type=client_credentials&client_id={api_key}&client_secret={secret_key}
```

**Response:**
```json
{
  "access_token": "xxx",
  "expires_in": 2592000
}
```

#### 2.5.3 Chat Completions
**Endpoint:** `POST /rpc/2.0/ai_custom/v1/wenxinworkshop/chat/{model}?access_token={token}`

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, world!"
    }
  ],
  "temperature": 0.7
}
```

**Response:**
```json
{
  "id": "as-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "result": "你好，世界！",
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  }
}
```

**可用模型路径:**
| 路径 | 说明 |
|------|------|
| completions | ERNIE-Bot |
| completions_pro | ERNIE-Bot 4.0 |
| ernie-3.5-8k | ERNIE-3.5-8K |

---

### 2.6 OpenAI兼容接口

支持任意实现了OpenAI API标准的服务，用户可自定义Base URL。

#### 2.6.1 标准格式
**Endpoint:** `POST {base_url}/v1/chat/completions`

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer {api_key}
```

**Request Body:**
```json
{
  "model": "{model_id}",
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

---

## 3. 插件内部消息协议

### 3.1 消息格式定义

```typescript
interface Message<T = any> {
  type: MessageType;
  payload: T;
  requestId?: string;  // 用于请求追踪
}

interface Response<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### 3.2 消息类型枚举

```typescript
enum MessageType {
  // 翻译相关
  TRANSLATE_PAGE = 'TRANSLATE_PAGE',
  TRANSLATE_TEXT = 'TRANSLATE_TEXT',
  TRANSLATE_SELECTION = 'TRANSLATE_SELECTION',

  // 内容提炼
  EXTRACT_CONTENT = 'EXTRACT_CONTENT',

  // 设置相关
  GET_SETTINGS = 'GET_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',

  // 缓存相关
  GET_CACHE = 'GET_CACHE',
  SET_CACHE = 'SET_CACHE',
  CLEAR_CACHE = 'CLEAR_CACHE',

  // 状态同步
  SYNC_STATE = 'SYNC_STATE',
  STATE_CHANGED = 'STATE_CHANGED'
}
```

---

### 3.3 翻译相关接口

#### 3.3.1 TRANSLATE_PAGE - 页面翻译控制

**用途:** 开启/关闭当前页面的翻译功能

**Request:**
```typescript
{
  type: 'TRANSLATE_PAGE',
  payload: {
    enabled: boolean;
    tabId?: number;
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    enabled: boolean;
  }
}
```

---

#### 3.3.2 TRANSLATE_TEXT - 文本翻译

**用途:** 翻译指定文本内容

**Request:**
```typescript
{
  type: 'TRANSLATE_TEXT',
  payload: {
    text: string;
    targetLang?: string;  // 默认 'zh-CN'
    sourceUrl?: string;   // 用于缓存
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    original: string;
    translation: string;
    cached: boolean;      // 是否来自缓存
  }
}
```

**Error Codes:**
| Code | 说明 |
|------|------|
| TRANSLATE_EMPTY_TEXT | 文本为空 |
| TRANSLATE_API_ERROR | API调用失败 |
| TRANSLATE_RATE_LIMIT | 请求频率限制 |
| TRANSLATE_QUOTA_EXCEEDED | 配额超限 |

---

#### 3.3.3 TRANSLATE_SELECTION - 划词翻译

**用途:** 翻译用户选中的文本

**Request:**
```typescript
{
  type: 'TRANSLATE_SELECTION',
  payload: {
    text: string;
    position: {
      x: number;
      y: number;
    };
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    translation: string;
  }
}
```

---

### 3.4 内容提炼接口

#### 3.4.1 EXTRACT_CONTENT - 内容提炼

**用途:** 提取网页内容并生成Markdown

**Request:**
```typescript
{
  type: 'EXTRACT_CONTENT',
  payload: {
    url: string;
    title: string;
    content: string;      // 页面正文HTML或纯文本
    options?: {
      includeImages?: boolean;
      maxLength?: number;
    }
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    markdown: string;
    metadata: {
      title: string;
      wordCount: number;
      extractedAt: string;
    }
  }
}
```

**Markdown输出格式:**
```markdown
# {文章标题}

## 摘要
{AI生成的摘要，200-500字}

## 核心观点
- {观点1}
- {观点2}
- {观点3}

## 正文内容
{结构化的正文内容}

---
> **来源:** {原文URL}
> **提炼时间:** {ISO时间戳}
> **字数:** {字数}
```

---

### 3.5 设置相关接口

#### 3.5.1 GET_SETTINGS - 获取设置

**Request:**
```typescript
{
  type: 'GET_SETTINGS',
  payload: {
    keys?: string[];  // 可选，指定获取的设置项
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    activeModel: string;
    models: {
      [key: string]: {
        apiKey: string;
        baseUrl: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
      }
    };
    translation: {
      enabled: boolean;
      showOriginal: boolean;
      autoTranslate: boolean;
    };
    shortcuts: {
      toggleTranslation: string;
      extractContent: string;
    }
  }
}
```

---

#### 3.5.2 UPDATE_SETTINGS - 更新设置

**Request:**
```typescript
{
  type: 'UPDATE_SETTINGS',
  payload: {
    // 支持部分更新
    activeModel?: string;
    models?: {...};
    translation?: {...};
    shortcuts?: {...};
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    updated: string[];  // 更新的字段列表
  }
}
```

---

### 3.6 缓存相关接口

#### 3.6.1 GET_CACHE - 获取缓存

**Request:**
```typescript
{
  type: 'GET_CACHE',
  payload: {
    url: string;
    text: string;
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    translation: string | null;
    cachedAt?: string;
  }
}
```

---

#### 3.6.2 SET_CACHE - 设置缓存

**Request:**
```typescript
{
  type: 'SET_CACHE',
  payload: {
    url: string;
    text: string;
    translation: string;
  }
}
```

**Response:**
```typescript
{
  success: true
}
```

---

#### 3.6.3 CLEAR_CACHE - 清除缓存

**Request:**
```typescript
{
  type: 'CLEAR_CACHE',
  payload: {
    url?: string;  // 可选，指定URL；不传则清除全部
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    clearedCount: number;
  }
}
```

---

### 3.7 状态同步接口

#### 3.7.1 SYNC_STATE - 状态同步请求

**用途:** Content Script请求当前页面的翻译状态

**Request:**
```typescript
{
  type: 'SYNC_STATE',
  payload: {
    tabId: number;
    url: string;
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    translationEnabled: boolean;
    activeModel: string;
  }
}
```

---

#### 3.7.2 STATE_CHANGED - 状态变更通知

**用途:** Background向Content Script广播状态变更

**Message (Background -> Content Script):**
```typescript
{
  type: 'STATE_CHANGED',
  payload: {
    translationEnabled?: boolean;
    activeModel?: string;
  }
}
```

---

## 4. Chrome Storage结构

### 4.1 存储分区

| 分区 | API | 容量 | 用途 |
|------|-----|------|------|
| local | `chrome.storage.local` | 10MB | 设置、缓存 |
| sync | `chrome.storage.sync` | 100KB | 跨设备同步设置 |

---

### 4.2 Local Storage结构

```typescript
interface LocalStorage {
  // 用户设置
  settings: {
    // 当前激活的模型
    activeModel: 'deepseek' | 'kimi' | 'qwen' | 'wenxin' | 'openai';

    // 各模型配置
    models: {
      deepseek: {
        apiKey: string;           // 加密存储
        baseUrl: string;
        model: string;
        temperature: number;
        maxTokens: number;
      };
      kimi: {...};
      qwen: {...};
      wenxin: {
        apiKey: string;           // API Key
        secretKey: string;        // Secret Key (加密)
        accessToken?: string;     // 缓存的Access Token
        tokenExpires?: number;    // Token过期时间
      };
      openai: {
        apiKey: string;
        baseUrl: string;          // 自定义Base URL
        model: string;
      };
    };

    // 翻译设置
    translation: {
      enabled: boolean;           // 是否启用
      showOriginal: boolean;      // 显示原文
      autoTranslate: boolean;     // 自动翻译
      excludeTags: string[];      // 排除的标签
    };

    // 快捷键设置
    shortcuts: {
      toggleTranslation: string;  // 默认 'Alt+T'
      extractContent: string;     // 默认 'Alt+E'
    };

    // UI设置
    ui: {
      theme: 'light' | 'dark' | 'system';
      fontSize: number;
    };
  };

  // 翻译缓存
  cache: {
    // 按URL分组的翻译缓存
    translations: {
      [url: string]: {
        [textHash: string]: {
          original: string;
          translation: string;
          cachedAt: number;
        }
      }
    };

    // 缓存元数据
    metadata: {
      lastCleared: number;
      totalSize: number;
    };
  };

  // 页面状态 (按tabId存储)
  tabStates: {
    [tabId: string]: {
      translationEnabled: boolean;
      translatedCount: number;
    }
  };
}
```

---

### 4.3 Sync Storage结构

```typescript
interface SyncStorage {
  // 基础设置 (跨设备同步)
  syncSettings: {
    activeModel: string;
    translation: {
      showOriginal: boolean;
      autoTranslate: boolean;
    };
    shortcuts: {
      toggleTranslation: string;
      extractContent: string;
    };
  };
}
```

---

### 4.4 默认值

```typescript
const DEFAULT_SETTINGS = {
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
      baseUrl: '',
      model: 'gpt-3.5-turbo'
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

const DEFAULT_CACHE = {
  translations: {},
  metadata: {
    lastCleared: Date.now(),
    totalSize: 0
  }
};
```

---

## 5. 快捷键命令

### 5.1 Manifest Commands配置

```json
{
  "commands": {
    "toggle-translation": {
      "suggested_key": {
        "default": "Alt+T",
        "mac": "Alt+T"
      },
      "description": "开启/关闭页面翻译"
    },
    "extract-content": {
      "suggested_key": {
        "default": "Alt+E",
        "mac": "Alt+E"
      },
      "description": "提炼当前页面内容"
    },
    "_execute_action": {
      "suggested_key": {
        "default": "Alt+W"
      },
      "description": "打开插件弹窗"
    }
  }
}
```

### 5.2 快捷键处理

```typescript
// src/background/index.ts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  switch (command) {
    case 'toggle-translation':
      // 切换翻译状态
      const settings = await storage.getSettings();
      const newEnabled = !settings.translation.enabled;
      await storage.setSettings({
        translation: { ...settings.translation, enabled: newEnabled }
      });
      // 通知Content Script
      chrome.tabs.sendMessage(tab.id!, {
        type: 'STATE_CHANGED',
        payload: { translationEnabled: newEnabled }
      });
      break;

    case 'extract-content':
      // 触发内容提炼
      chrome.tabs.sendMessage(tab.id!, {
        type: 'TRIGGER_EXTRACT'
      });
      break;
  }
});
```

---

## 6. 错误码定义

### 6.1 通用错误

| Code | HTTP Status | 说明 |
|------|-------------|------|
| UNKNOWN_ERROR | - | 未知错误 |
| INVALID_REQUEST | 400 | 请求参数无效 |
| UNAUTHORIZED | 401 | 未授权/API Key无效 |
| FORBIDDEN | 403 | 禁止访问 |
| NOT_FOUND | 404 | 资源不存在 |
| RATE_LIMITED | 429 | 请求频率超限 |
| SERVER_ERROR | 500 | 服务器错误 |

### 6.2 业务错误

| Code | 说明 |
|------|------|
| MODEL_NOT_CONFIGURED | 模型未配置API Key |
| MODEL_NOT_SUPPORTED | 不支持的模型类型 |
| TRANSLATION_EMPTY_TEXT | 翻译文本为空 |
| TRANSLATION_TOO_LONG | 翻译文本过长 |
| EXTRACTION_FAILED | 内容提取失败 |
| CACHE_FULL | 缓存已满 |
| STORAGE_ERROR | 存储操作失败 |

---

## 7. 版本兼容性

### 7.1 API版本控制

消息格式支持版本字段，便于后续升级：

```typescript
interface VersionedMessage<T = any> {
  version: string;  // 如 '1.0'
  type: MessageType;
  payload: T;
}
```

### 7.2 向后兼容策略

- 新增字段使用可选类型
- 废弃字段标记为deprecated，保留2个版本
- 大版本升级提供迁移脚本

---

## 8. 附录

### 8.1 TypeScript类型定义文件

完整类型定义参见：`src/types/` 目录

### 8.2 Postman Collection

API测试集合：`docs/postman/ai-web-translator.json`

### 8.3 更新日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0.0 | 2025-12-06 | 初始版本 |
