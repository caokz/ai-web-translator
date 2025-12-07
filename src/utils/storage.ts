import type { Settings, Cache, CacheItem } from '../types/settings';
import { DEFAULT_SETTINGS, DEFAULT_CACHE } from '../types/settings';

/**
 * Chrome Storage API 封装
 */
class StorageManager {
  /**
   * 获取所有设置
   */
  async getSettings(): Promise<Settings> {
    try {
      const result = await chrome.storage.local.get('settings');
      return { ...DEFAULT_SETTINGS, ...result.settings };
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * 设置配置
   */
  async setSettings(settings: Partial<Settings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await chrome.storage.local.set({ settings: updated });
    } catch (error) {
      console.error('Error setting settings:', error);
      throw error;
    }
  }

  /**
   * 获取缓存
   */
  async getCache(): Promise<Cache> {
    try {
      const result = await chrome.storage.local.get('cache');
      return result.cache || DEFAULT_CACHE;
    } catch (error) {
      console.error('Error getting cache:', error);
      return DEFAULT_CACHE;
    }
  }

  /**
   * 获取特定URL的翻译缓存
   */
  async getTranslationCache(url: string, text: string): Promise<string | null> {
    try {
      const cache = await this.getCache();
      const urlCache = cache.translations[url];
      if (!urlCache) return null;

      // 创建文本哈希作为键
      const textHash = this.hashText(text);
      return urlCache[textHash]?.translation || null;
    } catch (error) {
      console.error('Error getting translation cache:', error);
      return null;
    }
  }

  /**
   * 设置翻译缓存
   */
  async setTranslationCache(url: string, text: string, translation: string): Promise<void> {
    try {
      const cache = await this.getCache();
      const textHash = this.hashText(text);

      if (!cache.translations[url]) {
        cache.translations[url] = {};
      }

      cache.translations[url][textHash] = {
        original: text,
        translation,
        cachedAt: Date.now()
      };

      await chrome.storage.local.set({ cache });
    } catch (error) {
      console.error('Error setting translation cache:', error);
      throw error;
    }
  }

  /**
   * 清除缓存
   */
  async clearCache(url?: string): Promise<number> {
    try {
      const cache = await this.getCache();
      let clearedCount = 0;

      if (url) {
        if (cache.translations[url]) {
          clearedCount = Object.keys(cache.translations[url]).length;
          delete cache.translations[url];
        }
      } else {
        clearedCount = Object.keys(cache.translations).reduce(
          (sum, key) => sum + Object.keys(cache.translations[key]).length,
          0
        );
        cache.translations = {};
      }

      cache.metadata.lastCleared = Date.now();
      await chrome.storage.local.set({ cache });
      return clearedCount;
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * 简单的文本哈希函数
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }
}

// 导出单例实例
export const storage = new StorageManager();
