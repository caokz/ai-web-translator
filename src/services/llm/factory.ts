import { BaseLLMService, type LLMConfig } from './base';
import { DeepSeekService } from './deepseek';
import { KimiService } from './kimi';
import { OpenAIService } from './openai';
import { QwenService } from './qwen';
import { WenxinService } from './wenxin';
import type { ModelType } from '../../types/settings';

/**
 * LLM服务工厂
 */
export class LLMServiceFactory {
  static createService(modelType: ModelType, config: LLMConfig): BaseLLMService {
    switch (modelType) {
      case 'deepseek':
        return new DeepSeekService(config);
      case 'kimi':
        return new KimiService(config);
      case 'openai':
        return new OpenAIService(config);
      case 'qwen':
        return new QwenService(config);
      case 'wenxin':
        return new WenxinService(config);
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
  }

  /**
   * 获取模型的默认配置
   */
  static getDefaultConfig(modelType: ModelType): Partial<LLMConfig> {
    const configs: Record<ModelType, Partial<LLMConfig>> = {
      deepseek: {
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 1000
      },
      kimi: {
        baseUrl: 'https://api.moonshot.cn',
        model: 'moonshot-v1-8k',
        temperature: 0.7,
        maxTokens: 1000
      },
      openai: {
        baseUrl: 'https://api.openai.com',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000
      },
      qwen: {
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode',
        model: 'qwen-turbo',
        temperature: 0.7,
        maxTokens: 1000
      },
      wenxin: {
        baseUrl: 'https://aip.baidubce.com',
        temperature: 0.7,
        maxTokens: 1000
      }
    };

    return configs[modelType] || {};
  }

  /**
   * 获取所有支持的模型列表
   */
  static getSupportedModels(): ModelType[] {
    return ['deepseek', 'kimi', 'openai', 'qwen', 'wenxin'];
  }

  /**
   * 获取模型的显示名称
   */
  static getModelDisplayName(modelType: ModelType): string {
    const names: Record<ModelType, string> = {
      deepseek: 'DeepSeek',
      kimi: 'Kimi (月之暗面)',
      openai: 'OpenAI',
      qwen: '通义千问',
      wenxin: '文心一言'
    };
    return names[modelType] || modelType;
  }
}

/**
 * 获取LLM服务的全局实例（单例模式）
 */
let currentService: BaseLLMService | null = null;
let currentModel: ModelType | null = null;

export async function getLLMService(modelType: ModelType, config: LLMConfig): Promise<BaseLLMService> {
  if (currentService && currentModel === modelType) {
    return currentService;
  }

  currentService = LLMServiceFactory.createService(modelType, config);
  currentModel = modelType;
  return currentService;
}

export function invalidateLLMService(): void {
  currentService = null;
  currentModel = null;
}
