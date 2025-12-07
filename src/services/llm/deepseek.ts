import { BaseLLMService, type ChatMessage, type LLMConfig } from './base';

export class DeepSeekService extends BaseLLMService {
  constructor(config: LLMConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://api.deepseek.com'
    });
  }

  protected getEndpoint(): string {
    return `${this.config.baseUrl}/v1/chat/completions`;
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
      max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 1000,
      stream: false
    };
  }

  protected parseResponse(data: any): string {
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response format from DeepSeek API');
    }
    return data.choices[0].message?.content || '';
  }
}
