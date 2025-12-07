export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  secretKey?: string; // For Wenxin
  accessToken?: string;
  tokenExpires?: number;
}

export interface TranslateOptions {
  targetLang?: string;
}

export interface TranslateResult {
  original: string;
  translation: string;
}

export interface SummarizeResult {
  markdown: string;
  wordCount: number;
}

/**
 * LLM服务基类
 */
export abstract class BaseLLMService {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Chat API 调用
   */
  async chat(messages: ChatMessage[], options?: Partial<LLMConfig>): Promise<string> {
    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(this.buildBody(messages, options))
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API Error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  /**
   * 翻译文本
   */
  async translate(text: string, targetLang: string = 'zh-CN'): Promise<TranslateResult> {
    const langName = targetLang === 'zh-CN' ? '简体中文' : targetLang;
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的翻译助手。请将用户输入的内容翻译成${langName}。
要求：
1. 保持原文的格式和结构
2. 翻译要准确自然，符合目标语言的表达习惯
3. 专业术语保持准确
4. 只输出翻译结果，不要有其他解释`
      },
      { role: 'user', content: text }
    ];

    const translation = await this.chat(messages, { maxTokens: 2000 });
    return {
      original: text,
      translation: translation.trim()
    };
  }

  /**
   * 内容提炼
   */
  async summarize(content: string): Promise<SummarizeResult> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的内容提炼助手。请分析用户提供的内容，生成结构化的Markdown文档。
要求：
1. 提取文章标题（用# 标记）
2. 生成200-500字的摘要（## 摘要 部分）
3. 列出3-5个核心观点（## 核心观点 部分）
4. 保持原文的重要信息
5. 整个响应必须是有效的Markdown格式`
      },
      { role: 'user', content: content }
    ];

    const markdown = await this.chat(messages, { maxTokens: 3000 });
    const wordCount = markdown.split(/\s+/).length;

    return {
      markdown: markdown.trim(),
      wordCount
    };
  }

  /**
   * 获取API端点
   */
  protected abstract getEndpoint(): string;

  /**
   * 构建请求头
   */
  protected abstract buildHeaders(): HeadersInit;

  /**
   * 构建请求体
   */
  protected abstract buildBody(messages: ChatMessage[], options?: Partial<LLMConfig>): object;

  /**
   * 解析响应
   */
  protected abstract parseResponse(data: any): string;

  /**
   * 验证API Key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const result = await this.chat([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "ok"' }
      ], { maxTokens: 10 });
      return result.toLowerCase().includes('ok');
    } catch {
      return false;
    }
  }
}
