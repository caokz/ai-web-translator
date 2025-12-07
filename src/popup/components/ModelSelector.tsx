import type { ModelType } from '../../types/settings';

const MODELS: { type: ModelType; name: string; emoji: string }[] = [
  { type: 'deepseek', name: 'DeepSeek', emoji: '🔍' },
  { type: 'kimi', name: 'Kimi', emoji: '🌙' },
  { type: 'openai', name: 'OpenAI', emoji: '🤖' },
  { type: 'qwen', name: '通义千问', emoji: '🔮' },
  { type: 'wenxin', name: '文心一言', emoji: '💡' }
];

interface ModelSelectorProps {
  activeModel: string;
  onChange: (model: string) => Promise<void>;
}

export default function ModelSelector({ activeModel, onChange }: ModelSelectorProps) {
  const currentModel = MODELS.find(m => m.type === activeModel);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        选择翻译模型
      </label>

      <select
        value={activeModel}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {MODELS.map(model => (
          <option key={model.type} value={model.type}>
            {model.emoji} {model.name}
          </option>
        ))}
      </select>

      {currentModel && (
        <div className="mt-2 text-xs text-gray-600">
          <p>当前模型: <span className="font-semibold">{currentModel.emoji} {currentModel.name}</span></p>
        </div>
      )}
    </div>
  );
}
