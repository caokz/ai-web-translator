import { getLLMService } from './llm/factory';
import { storage } from '../utils/storage';
import type { TranslateResult } from './llm/base';
import type { Settings, ModelType } from '../types/settings';

/**
 * 翻译服务
 */
export class TranslatorService {
  /**
   * 翻译文本
   */
  async translate(text: string, targetLang: string = 'zh-CN'): Promise<TranslateResult> {
    try {
      console.log(`🔍 TranslatorService.translate() - text: "${text.substring(0, 50)}..."`);

      // 检查缓存
      const cachedTranslation = await storage.getTranslationCache(
        this.getCurrentUrl(),
        text
      );
      if (cachedTranslation) {
        console.log(`💾 Cache hit: "${cachedTranslation.substring(0, 50)}..."`);
        return {
          original: text,
          translation: cachedTranslation
        };
      }

      // 获取设置
      const settings = await storage.getSettings();
      console.log(`🔍 Settings loaded - activeModel: ${settings.activeModel}`);

      // 验证API Key是否配置
      const activeModel = settings.activeModel as ModelType;
      const modelConfig = settings.models[activeModel];

      console.log(`🔍 Model config - hasApiKey: ${!!modelConfig.apiKey}, model: ${activeModel}`);

      if (!modelConfig.apiKey) {
        const errorMsg = `模型 ${activeModel} 的API Key未配置`;
        console.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // 获取LLM服务
      console.log(`🚀 Getting LLM service for ${activeModel}...`);
      const llmService = await getLLMService(activeModel, modelConfig);

      // 执行翻译
      console.log(`📤 Calling LLM API...`);
      const result = await llmService.translate(text, targetLang);
      console.log(`✅ LLM translation result: "${result.translation.substring(0, 50)}..."`);

      // 缓存结果
      try {
        await storage.setTranslationCache(
          this.getCurrentUrl(),
          text,
          result.translation
        );
        console.log(`💾 Cached translation result`);
      } catch (cacheError) {
        console.warn(`⚠️ Failed to cache translation:`, cacheError);
        // 不因为缓存失败而中断翻译
      }

      return result;
    } catch (error) {
      console.error(`❌ TranslatorService.translate() error:`, {
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * 批量翻译
   */
  async translateBatch(texts: string[], targetLang: string = 'zh-CN'): Promise<TranslateResult[]> {
    const results: TranslateResult[] = [];

    for (const text of texts) {
      try {
        const result = await this.translate(text, targetLang);
        results.push(result);
      } catch (error) {
        console.error(`❌ Batch translation failed for text: "${text.substring(0, 30)}..."`, error);
        // 继续处理其他文本，不中断整个批处理
      }

      // 添加延迟，避免API请求频率过高
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  private getCurrentUrl(): string {
    // 这个方法会在Content Script中被覆盖
    return 'unknown';
  }
}

export const translatorService = new TranslatorService();
