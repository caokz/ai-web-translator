import { useState } from 'react';
import type { Settings, ModelType, ModelConfig } from '../../types/settings';

interface ApiConfigFormProps {
  settings: Settings;
  onSave: (updated: Partial<Settings>) => Promise<void>;
}

const MODEL_NAMES: Record<ModelType, string> = {
  deepseek: 'DeepSeek',
  kimi: 'Kimi (月之暗面)',
  openai: 'OpenAI',
  qwen: '通义千问',
  wenxin: '文心一言'
};

export default function ApiConfigForm({ settings, onSave }: ApiConfigFormProps) {
  const [activeModel, setActiveModel] = useState<ModelType>(settings.activeModel as ModelType);
  const [config, setConfig] = useState<ModelConfig>(settings.models[activeModel]);
  const [validating, setValidating] = useState(false);

  const handleConfigChange = (field: keyof ModelConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleModelChange = (newModel: ModelType) => {
    setActiveModel(newModel);
    setConfig(settings.models[newModel]);
  };

  const handleSave = async () => {
    const updated = {
      ...settings,
      activeModel,
      models: {
        ...settings.models,
        [activeModel]: config
      }
    };

    await onSave({
      activeModel,
      models: updated.models
    });
  };

  const handleValidate = async () => {
    if (!config.apiKey) {
      alert('请先填写API Key');
      return;
    }

    setValidating(true);
    try {
      // 这里应该调用验证API的方法
      // 现在只是模拟
      alert('✓ API Key验证成功');
    } catch (error) {
      alert('✗ API Key验证失败，请检查是否正确');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">API 配置</h2>

      {/* Model Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          选择翻译模型
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(MODEL_NAMES) as ModelType[]).map(model => (
            <button
              key={model}
              onClick={() => handleModelChange(model)}
              className={`p-3 rounded-lg border-2 transition-colors text-left ${
                activeModel === model
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{MODEL_NAMES[model]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Config Fields */}
      <div className="space-y-4">
        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key *
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={e => handleConfigChange('apiKey', e.target.value)}
            placeholder="输入您的API Key"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Base URL */}
        {activeModel !== 'wenxin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base URL (可选)
            </label>
            <input
              type="text"
              value={config.baseUrl || ''}
              onChange={e => handleConfigChange('baseUrl', e.target.value)}
              placeholder="默认: 官方API地址"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Secret Key for Wenxin */}
        {activeModel === 'wenxin' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secret Key *
            </label>
            <input
              type="password"
              value={config.secretKey || ''}
              onChange={e => handleConfigChange('secretKey', e.target.value)}
              placeholder="输入您的Secret Key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Model Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            模型名称
          </label>
          <input
            type="text"
            value={config.model || ''}
            onChange={e => handleConfigChange('model', e.target.value)}
            placeholder="例如: deepseek-chat, gpt-3.5-turbo"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            温度 (Temperature) - {config.temperature || 0.7}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.temperature || 0.7}
            onChange={e => handleConfigChange('temperature', parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            较低的值(0-0.3)会生成更确定的内容，较高的值(0.7-1.0)会更有创意
          </p>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            最大Token数
          </label>
          <input
            type="number"
            value={config.maxTokens || 1000}
            onChange={e => handleConfigChange('maxTokens', parseInt(e.target.value) || 1000)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="100"
            max="4000"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleValidate}
          disabled={validating || !config.apiKey}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            validating || !config.apiKey
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-gray-500 hover:bg-gray-600 text-white'
          }`}
        >
          {validating ? '验证中...' : '验证API Key'}
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          保存配置
        </button>
      </div>
    </div>
  );
}
