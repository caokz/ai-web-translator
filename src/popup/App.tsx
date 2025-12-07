import { useEffect, useState } from 'react';
import TranslateToggle from './components/TranslateToggle';
import ExtractButton from './components/ExtractButton';
import ModelSelector from './components/ModelSelector';
import type { Settings } from '../types/settings';

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_SETTINGS',
        payload: {}
      });

      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateTranslationEnabled(enabled: boolean) {
    if (!settings) return;

    const updated = {
      ...settings,
      translation: { ...settings.translation, enabled }
    };

    setSettings(updated);

    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: {
        translation: updated.translation
      }
    });

    // 通知Content Script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'STATE_CHANGED',
        payload: { translationEnabled: enabled }
      }).catch(() => {
        // Content Script可能未加载
      });
    }
  }

  async function updateActiveModel(model: string) {
    if (!settings) return;

    const updated = { ...settings, activeModel: model };
    setSettings(updated);

    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: { activeModel: model }
    });
  }

  const styles = {
    wrapper: {
      width: '100%',
      backgroundColor: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      background: 'linear-gradient(to right, #3b82f6, #1e3a8a)',
      color: 'white',
      padding: '16px',
      borderBottom: '1px solid #ddd'
    },
    headerTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: '0 0 4px 0'
    },
    headerSubtitle: {
      fontSize: '13px',
      color: '#bfdbfe',
      margin: '0'
    },
    mainContent: {
      padding: '16px',
      display: 'flex' as const,
      flexDirection: 'column' as const,
      gap: '16px'
    },
    footer: {
      borderTop: '1px solid #e5e7eb',
      padding: '12px 16px',
      display: 'flex' as const,
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '13px',
      color: '#6b7280',
      backgroundColor: '#f9fafb'
    },
    footerButton: {
      backgroundColor: 'transparent',
      color: '#3b82f6',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      fontSize: '13px',
      padding: '0'
    },
    loadingContainer: {
      padding: '24px',
      textAlign: 'center' as const,
      color: '#9ca3af'
    },
    warningBox: {
      backgroundColor: '#fef3c7',
      border: '1px solid #fcd34d',
      borderRadius: '6px',
      padding: '12px',
      fontSize: '13px',
      color: '#92400e'
    },
    warningTitle: {
      fontWeight: '600',
      marginBottom: '4px',
      margin: '0'
    },
    warningText: {
      margin: '0 0 8px 0'
    },
    warningButton: {
      backgroundColor: 'transparent',
      color: '#92400e',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontSize: '13px',
      padding: '0'
    }
  };

  if (loading || !settings) {
    return (
      <div style={styles.loadingContainer}>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>AI Web Translator</h1>
        <p style={styles.headerSubtitle}>智能翻译和内容提炼</p>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* 翻译开关 */}
        <TranslateToggle
          enabled={settings.translation.enabled}
          onChange={updateTranslationEnabled}
        />

        {/* 提炼按钮 - 这是新增的导出功能 */}
        <ExtractButton />

        {/* 模型选择 */}
        <ModelSelector
          activeModel={settings.activeModel}
          onChange={updateActiveModel}
        />

        {/* API配置提示 */}
        {!settings.models[settings.activeModel as any].apiKey && (
          <div style={styles.warningBox}>
            <p style={styles.warningTitle}>⚠️ 需要配置API Key</p>
            <p style={styles.warningText}>当前模型未配置API Key，请进入设置配置。</p>
            <button
              onClick={() => chrome.runtime.openOptionsPage()}
              style={styles.warningButton}
            >
              前往设置 →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span>v1.0.0</span>
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          style={styles.footerButton}
        >
          设置
        </button>
      </div>
    </div>
  );
}
