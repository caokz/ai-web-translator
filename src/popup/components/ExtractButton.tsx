import { useState } from 'react';

type ExportMode = 'summarize' | 'raw';

export default function ExtractButton() {
  const [loading, setLoading] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>('raw');

  const handleExtract = async () => {
    setLoading(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      await chrome.tabs.sendMessage(tab.id, {
        type: 'TRIGGER_EXTRACT',
        payload: { mode: exportMode }
      });
    } catch (error) {
      console.error('Extract error:', error);
      alert('内容提取失败，请确保页面已完全加载');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      backgroundColor: '#f0f9ff',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px'
    },
    modeSection: {
      marginBottom: '12px'
    },
    modeLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    modeGrid: {
      display: 'grid' as const,
      gridTemplateColumns: '1fr 1fr',
      gap: '8px'
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px',
      cursor: 'pointer',
      borderRadius: '6px',
      border: '2px solid',
      transition: 'all 0.2s',
      fontSize: '12px',
      fontWeight: '600',
      color: '#374151'
    },
    radioLabelRawSelected: {
      borderColor: '#3b82f6',
      backgroundColor: '#dbeafe'
    },
    radioLabelRawUnselected: {
      borderColor: '#e5e7eb',
      backgroundColor: '#f9fafb'
    },
    radioLabelSummarizeSelected: {
      borderColor: '#3b82f6',
      backgroundColor: '#dbeafe'
    },
    radioLabelSummarizeUnselected: {
      borderColor: '#e5e7eb',
      backgroundColor: '#f9fafb'
    },
    radioInput: {
      marginRight: '8px',
      cursor: 'pointer'
    },
    description: {
      backgroundColor: 'white',
      borderRadius: '6px',
      padding: '8px',
      fontSize: '12px',
      color: '#4b5563',
      marginBottom: '12px',
      lineHeight: '1.4'
    },
    button: {
      width: '100%',
      padding: '10px 16px',
      borderRadius: '8px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '14px',
      marginBottom: '12px'
    },
    buttonActive: {
      backgroundColor: '#3b82f6',
      color: 'white',
      boxShadow: '0 4px 6px rgba(59, 130, 246, 0.15)'
    },
    buttonDisabled: {
      backgroundColor: '#d1d5db',
      color: '#6b7280',
      cursor: 'not-allowed'
    },
    shortcutHint: {
      fontSize: '12px',
      color: '#9ca3af',
      textAlign: 'center' as const
    },
    kbd: {
      backgroundColor: '#e5e7eb',
      padding: '2px 6px',
      borderRadius: '3px',
      fontFamily: 'monospace',
      fontSize: '11px'
    }
  };

  return (
    <div style={styles.container}>
      {/* 导出模式选择 */}
      <div style={styles.modeSection}>
        <div style={styles.modeLabel}>📄 导出模式</div>
        <div style={styles.modeGrid}>
          <label
            style={{
              ...styles.radioLabel,
              ...(exportMode === 'raw' ? styles.radioLabelRawSelected : styles.radioLabelRawUnselected)
            }}
          >
            <input
              type="radio"
              name="exportMode"
              value="raw"
              checked={exportMode === 'raw'}
              onChange={() => setExportMode('raw')}
              style={styles.radioInput}
            />
            <span>原网页内容</span>
          </label>
          <label
            style={{
              ...styles.radioLabel,
              ...(exportMode === 'summarize' ? styles.radioLabelSummarizeSelected : styles.radioLabelSummarizeUnselected)
            }}
          >
            <input
              type="radio"
              name="exportMode"
              value="summarize"
              checked={exportMode === 'summarize'}
              onChange={() => setExportMode('summarize')}
              style={styles.radioInput}
            />
            <span>AI提炼</span>
          </label>
        </div>
      </div>

      {/* 模式描述 */}
      <div style={styles.description}>
        {exportMode === 'raw' ? (
          <p style={{ margin: 0 }}>✨ 保留原网页结构，导出完整内容，适合保存参考资料</p>
        ) : (
          <p style={{ margin: 0 }}>🤖 使用AI提炼关键内容，适合快速浏览和记笔记</p>
        )}
      </div>

      {/* 导出按钮 */}
      <button
        onClick={handleExtract}
        disabled={loading}
        style={{
          ...styles.button,
          ...(loading ? styles.buttonDisabled : styles.buttonActive)
        }}
      >
        {loading ? '导出中...' : '📥 导出为Markdown'}
      </button>

      {/* 快捷键提示 */}
      <div style={styles.shortcutHint}>
        💡 快捷键: <kbd style={styles.kbd}>Alt+E</kbd>
      </div>
    </div>
  );
}
