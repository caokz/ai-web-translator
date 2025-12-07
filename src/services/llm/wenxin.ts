import { BaseLLMService, type ChatMessage, type LLMConfig } from './base';

export class WenxinService extends BaseLLMService {
  constructor(config: LLMConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://aip.baidubce.com'
    });
  }

  protected buildHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json'
    };
  }

  protected buildBody(messages: ChatMessage[], options?: Partial<LLMConfig>): object {
    // 文心一言的请求体格式不同
    return {
      messages: messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.content
      })),
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      top_p: 0.8
    };
  }

  protected parseResponse(data: any): string {
    // 文心一言的响应格式也不同
    if (data.result) {
      return data.result;
    }
    throw new Error('Invalid response format from Wenxin API');
  }

  protected getEndpoint(): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const token = this.config.accessToken || '';
    return `${baseUrl}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${token}`;
  }

  async chat(messages: ChatMessage[], options?: Partial<LLMConfig>): Promise<string> {
    // 文心一言需要先获取access_token
    if (!this.config.accessToken || (this.config.tokenExpires || 0) < Date.now()) {
      await this.refreshAccessToken();
    }

    return super.chat(messages, options);
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await fetch(
      `${this.config.baseUrl}/oauth/2.0/token?grant_type=client_credentials&client_id=${this.config.apiKey}&client_secret=${this.config.secretKey}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error('Failed to refresh Wenxin access token');
    }

    const data = await response.json() as any;
    this.config.accessToken = data.access_token;
    this.config.tokenExpires = Date.now() + (data.expires_in || 2592000) * 1000;
  }
}
