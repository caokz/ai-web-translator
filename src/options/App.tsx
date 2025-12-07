import { useEffect, useState } from 'react';
import ApiConfigForm from './components/ApiConfigForm';
import type { Settings, ModelType } from '../types/settings';

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

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

  async function saveSettings(updated: Partial<Settings>) {
    if (!settings) return;

    const newSettings = { ...settings, ...updated };
    setSettings(newSettings);

    await chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: updated
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function clearCache() {
    if (!confirm('确定要清除所有缓存吗？')) return;

    await chrome.runtime.sendMessage({
      type: 'CLEAR_CACHE',
      payload: {}
    });

    alert('缓存已清除');
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Web Translator 设置</h1>
          <p className="text-gray-600 mt-1">配置翻译和内容提炼的参数</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Save Notification */}
        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            ✓ 设置已保存
          </div>
        )}

        {/* API Config */}
        <ApiConfigForm
          settings={settings}
          onSave={saveSettings}
        />

        {/* Cache Management */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">缓存管理</h2>
          <p className="text-gray-600 mb-4">
            已翻译的内容会被缓存，避免重复请求API。点击下方按钮可清除所有缓存。
          </p>
          <button
            onClick={clearCache}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            清除缓存
          </button>
        </div>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">帮助信息</h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>快捷键：</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><kbd className="bg-blue-200 px-2 py-1 rounded">Alt+T</kbd> - 开启/关闭页面翻译</li>
              <li><kbd className="bg-blue-200 px-2 py-1 rounded">Alt+E</kbd> - 提炼当前页面内容</li>
            </ul>
            <p className="mt-3"><strong>获取API Key：</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li><a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">DeepSeek</a></li>
              <li><a href="https://platform.moonshot.cn/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Kimi</a></li>
              <li><a href="https://help.aliyun.com/zh/dashscope/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">通义千问</a></li>
              <li><a href="https://cloud.baidu.com/doc/WENXINWORKSHOP/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">文心一言</a></li>
              <li><a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">OpenAI</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
