interface TranslateToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => Promise<void>;
}

export default function TranslateToggle({ enabled, onChange }: TranslateToggleProps) {
  const handleToggle = async () => {
    await onChange(!enabled);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">翻译当前页面</h3>
          <p className="text-sm text-gray-600 mt-1">
            {enabled ? '已启用 - 页面内容将显示中文翻译' : '未启用 - 点击启用'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            enabled
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
          }`}
        >
          {enabled ? '关闭' : '启用'}
        </button>
      </div>

      {/* 快捷键提示 */}
      <div className="mt-3 text-xs text-gray-500">
        💡 快捷键: <kbd className="bg-gray-200 px-2 py-1 rounded">Alt+T</kbd>
      </div>
    </div>
  );
}
