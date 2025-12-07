import { getLLMService } from './llm/factory';
import { storage } from '../utils/storage';
import type { SummarizeResult } from './llm/base';
import type { ModelType } from '../types/settings';

export type ExportMode = 'raw' | 'summarize';

/**
 * 内容提取服务
 */
export class ContentExtractorService {
  /**
   * 提取页面内容并生成Markdown
   */
  async extract(
    content: string,
    url: string,
    title: string = 'Document',
    mode: ExportMode = 'raw'
  ): Promise<{ markdown: string; wordCount: number }> {
    if (mode === 'raw') {
      return this.extractRaw(content, url, title);
    } else {
      return this.extractSummarize(content, url, title);
    }
  }

  /**
   * 原网页内容导出
   */
  private extractRaw(
    content: string,
    url: string,
    title: string
  ): { markdown: string; wordCount: number } {
    // 对于raw模式，content已经是content script处理好的markdown格式
    // 这里不需要再处理，直接返回
    // (raw模式在content script中已经转换为markdown并下载了)

    // 这个方法仅在AI提炼模式的后备情况下使用
    const lines = content.split('\n').filter(line => line.trim());
    const markdown = lines
      .map(line => line.trim())
      .join('\n\n');

    const withMetadata = this.addMetadata(markdown, url, title, 'raw');

    return {
      markdown: withMetadata,
      wordCount: content.split(/\s+/).length
    };
  }

  /**
   * AI提炼内容导出
   */
  private async extractSummarize(
    content: string,
    url: string,
    title: string
  ): Promise<{ markdown: string; wordCount: number }> {
    const settings = await storage.getSettings();

    // 验证API Key
    const activeModel = settings.activeModel as ModelType;
    const modelConfig = settings.models[activeModel];

    if (!modelConfig.apiKey) {
      throw new Error(`模型 ${activeModel} 的API Key未配置`);
    }

    // 获取LLM服务
    const llmService = await getLLMService(activeModel, modelConfig);

    // 清理内容
    const cleanedContent = this.cleanContent(content);

    // 执行提取
    const result = await llmService.summarize(cleanedContent);

    // 添加元信息
    const markdown = this.addMetadata(result.markdown, url, title, 'summarize');

    return {
      markdown,
      wordCount: result.wordCount
    };
  }

  /**
   * 清理页面内容
   */
  private cleanContent(content: string): string {
    // 移除HTML标签
    let cleaned = content.replace(/<[^>]*>/g, '');

    // 移除多余的空白符
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // 限制长度（避免API限制）
    const maxLength = 5000;
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...';
    }

    return cleaned;
  }

  /**
   * 添加元数据到Markdown
   */
  private addMetadata(markdown: string, url: string, title: string, mode: ExportMode): string {
    const timestamp = new Date().toISOString();
    const modeLabel = mode === 'raw' ? '原网页导出' : 'AI提炼';

    return `${markdown}

---

> **来源:** [${title}](${url})
> **导出模式:** ${modeLabel}
> **导出时间:** ${timestamp}
`;
  }

  /**
   * 从DOM提取正文内容
   */
  extractTextFromDOM(element: Element): string {
    const clone = element.cloneNode(true) as Element;

    // 移除不需要的元素
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      '.navbar',
      '.header',
      '.footer',
      '[role="navigation"]',
      '[class*="sidebar"]',
      '[class*="comment"]'
    ];

    unwantedSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // 提取文本
    return clone.textContent || '';
  }
}

export const contentExtractorService = new ContentExtractorService();
