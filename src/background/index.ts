import { translatorService } from '../services/translator';
import { contentExtractorService } from '../services/contentExtractor';
import { storage } from '../utils/storage';
import type { Message, MessageResponse } from '../types/message';

// 初始化消息监听器
function initializeMessageListener() {
  chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
      handleMessage(message, sender)
        .then(response => sendResponse(response))
        .catch(error => {
          console.error('Message handler error:', error);
          sendResponse({
            success: false,
            error: {
              code: 'INTERNAL_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        });

      // 保持消息通道开放（异步处理）
      return true;
    }
  );
}

// 处理消息
async function handleMessage(message: Message, sender: chrome.runtime.MessageSender): Promise<MessageResponse> {
  console.log('📨 Message received:', message.type, message.payload ? `(payload: ${JSON.stringify(message.payload).substring(0, 100)})` : '');

  switch (message.type) {
    case 'TRANSLATE_TEXT': {
      const { text, targetLang = 'zh-CN' } = message.payload;
      console.log(`🔍 TRANSLATE_TEXT handler - text length: ${text?.length || 0}, targetLang: ${targetLang}`);

      if (!text || text.trim().length === 0) {
        console.warn('⚠️ Empty text for translation');
        return {
          success: false,
          error: {
            code: 'TRANSLATE_EMPTY_TEXT',
            message: '翻译文本不能为空'
          }
        };
      }

      try {
        console.log('🚀 Calling translatorService.translate()...');
        const result = await translatorService.translate(text, targetLang);
        console.log(`✅ Translation completed: "${result.translation.substring(0, 50)}..."`);
        return {
          success: true,
          data: {
            original: result.original,
            translation: result.translation,
            cached: false
          }
        };
      } catch (error) {
        console.error('❌ Translation service error:', {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorCode: (error as any)?.code,
          stack: error instanceof Error ? error.stack : undefined
        });
        return {
          success: false,
          error: {
            code: 'TRANSLATION_FAILED',
            message: error instanceof Error ? error.message : 'Translation service error'
          }
        };
      }
    }

    case 'EXTRACT_CONTENT': {
      const { content, url, title, mode = 'raw' } = message.payload;
      console.log(`🔍 EXTRACT_CONTENT handler - content length: ${content?.length || 0}`);

      if (!content || content.trim().length === 0) {
        console.warn('⚠️ Empty content for extraction');
        return {
          success: false,
          error: {
            code: 'EXTRACT_EMPTY_CONTENT',
            message: '提取内容不能为空'
          }
        };
      }

      try {
        const result = await contentExtractorService.extract(content, url, title, mode);
        return {
          success: true,
          data: {
            markdown: result.markdown,
            metadata: {
              title: title || 'Document',
              wordCount: result.wordCount,
              mode: mode,
              extractedAt: new Date().toISOString()
            }
          }
        };
      } catch (error) {
        console.error('❌ Content extraction error:', error);
        return {
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message: error instanceof Error ? error.message : 'Content extraction error'
          }
        };
      }
    }

    case 'GET_SETTINGS': {
      const { keys } = message.payload || {};
      console.log(`🔍 GET_SETTINGS handler - keys: ${keys ? keys.join(',') : 'all'}`);

      try {
        const settings = await storage.getSettings();

        if (keys && Array.isArray(keys)) {
          const filtered: any = {};
          keys.forEach(key => {
            (filtered as any)[key] = (settings as any)[key];
          });
          return {
            success: true,
            data: filtered
          };
        }

        return {
          success: true,
          data: settings
        };
      } catch (error) {
        console.error('❌ Get settings error:', error);
        return {
          success: false,
          error: {
            code: 'GET_SETTINGS_FAILED',
            message: error instanceof Error ? error.message : 'Failed to get settings'
          }
        };
      }
    }

    case 'UPDATE_SETTINGS': {
      const updates = message.payload;
      console.log(`🔍 UPDATE_SETTINGS handler - updating: ${Object.keys(updates).join(',')}`);

      try {
        await storage.setSettings(updates);
        return {
          success: true,
          data: {
            updated: Object.keys(updates)
          }
        };
      } catch (error) {
        console.error('❌ Update settings error:', error);
        return {
          success: false,
          error: {
            code: 'UPDATE_SETTINGS_FAILED',
            message: error instanceof Error ? error.message : 'Failed to update settings'
          }
        };
      }
    }

    case 'GET_CACHE': {
      const { url, text } = message.payload;
      try {
        const cached = await storage.getTranslationCache(url, text);
        return {
          success: true,
          data: {
            translation: cached
          }
        };
      } catch (error) {
        console.error('❌ Get cache error:', error);
        return {
          success: false,
          error: {
            code: 'GET_CACHE_FAILED',
            message: error instanceof Error ? error.message : 'Failed to get cache'
          }
        };
      }
    }

    case 'SET_CACHE': {
      const { url, text, translation } = message.payload;
      try {
        await storage.setTranslationCache(url, text, translation);
        return {
          success: true
        };
      } catch (error) {
        console.error('❌ Set cache error:', error);
        return {
          success: false,
          error: {
            code: 'SET_CACHE_FAILED',
            message: error instanceof Error ? error.message : 'Failed to set cache'
          }
        };
      }
    }

    case 'CLEAR_CACHE': {
      const { url } = message.payload || {};
      try {
        const count = await storage.clearCache(url);
        return {
          success: true,
          data: {
            clearedCount: count
          }
        };
      } catch (error) {
        console.error('❌ Clear cache error:', error);
        return {
          success: false,
          error: {
            code: 'CLEAR_CACHE_FAILED',
            message: error instanceof Error ? error.message : 'Failed to clear cache'
          }
        };
      }
    }

    case 'SYNC_STATE': {
      try {
        const settings = await storage.getSettings();
        console.log(`🔍 SYNC_STATE - translation enabled: ${settings.translation.enabled}, model: ${settings.activeModel}`);
        return {
          success: true,
          data: {
            translationEnabled: settings.translation.enabled,
            activeModel: settings.activeModel
          }
        };
      } catch (error) {
        console.error('❌ Sync state error:', error);
        return {
          success: false,
          error: {
            code: 'SYNC_STATE_FAILED',
            message: error instanceof Error ? error.message : 'Failed to sync state'
          }
        };
      }
    }

    default:
      console.warn('⚠️ Unknown message type:', message.type);
      return {
        success: false,
        error: {
          code: 'UNKNOWN_MESSAGE_TYPE',
          message: `Unknown message type: ${message.type}`
        }
      };
  }
}

// 初始化快捷键处理
function initializeCommandListener() {
  chrome.commands.onCommand.addListener(async (command) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    switch (command) {
      case 'toggle-translation':
        // 获取当前设置
        const settings = await storage.getSettings();
        const newEnabled = !settings.translation.enabled;

        // 更新设置
        await storage.setSettings({
          translation: { ...settings.translation, enabled: newEnabled }
        });

        // 通知Content Script
        await chrome.tabs.sendMessage(tab.id, {
          type: 'STATE_CHANGED',
          payload: {
            translationEnabled: newEnabled
          }
        }).catch(() => {
          // Content Script可能未加载
        });
        break;

      case 'extract-content':
        // 触发内容提取
        await chrome.tabs.sendMessage(tab.id, {
          type: 'TRIGGER_EXTRACT'
        }).catch(() => {
          // Content Script可能未加载
        });
        break;
    }
  });
}

// 初始化标签页状态管理
function initializeTabStateListener() {
  // 监听标签页关闭事件
  chrome.tabs.onRemoved.addListener((tabId) => {
    // 清理该标签页的状态（如果需要）
  });
}

// 初始化安装事件
function initializeInstallListener() {
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      // 打开欢迎页面
      await chrome.tabs.create({
        url: 'src/options/index.html'
      });
    }
  });
}

// 启动所有初始化程序
console.log('🚀 Background Service Worker initializing...');
initializeMessageListener();
initializeCommandListener();
initializeTabStateListener();
initializeInstallListener();
console.log('✅ Background Service Worker initialized');
