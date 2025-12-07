# AI Web Translator

智能网页翻译与内容提炼助手 - 基于大语言模型的Chrome浏览器插件

## 功能特性

- 🌐 **页面翻译** - 一键翻译整个网页，支持实时双语对照显示
- ✨ **选词翻译** - 选中任意文本后自动显示翻译气泡，支持复制
- 📝 **内容提炼** - 智能提取网页内容并生成结构化Markdown文档
- 🤖 **多模型支持** - DeepSeek、Kimi、OpenAI、通义千问、文心一言
- ⚡ **快捷键支持** - Alt+T 开启翻译，Alt+E 提炼内容
- 💾 **智能缓存** - 已翻译内容缓存，减少API调用和成本
- 🎨 **并发翻译** - 支持最多5个并发翻译任务，加快网页翻译速度

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+
- Chrome/Edge 88+

### 安装和开发

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（支持热重载）
npm run dev
# 输出目录：dist/

# 3. 加载到Chrome
# - 打开 chrome://extensions/
# - 启用右上角"开发者模式"
# - 点击"加载已解压的扩展程序"
# - 选择 dist 文件夹

# 4. 运行类型检查
npm run type-check
```

### 生产构建

```bash
npm run build
# 输出在 dist/ 目录，可以：
# - 直接在Chrome中加载
# - 打包为.crx文件发布
# - 上传到Chrome Web Store
```

## 项目结构

```
ai-web-translator/
├── public/                    # 静态资源（扩展图标）
├── src/
│   ├── background/            # Service Worker（后台脚本）
│   │   └── index.ts          # 消息处理、LLM调用、缓存管理
│   ├── content/              # Content Script（注入网页的脚本）
│   │   └── index.ts          # DOM操作、选词翻译、文本注入
│   ├── popup/                # Popup弹窗UI（React组件）
│   │   ├── App.tsx           # Popup主界面
│   │   ├── main.tsx          # 入口
│   │   └── components/       # 翻译开关、模型选择等组件
│   ├── options/              # Options页面设置UI
│   │   ├── App.tsx           # 设置页主界面
│   │   ├── main.tsx          # 入口
│   │   └── components/       # API配置表单等
│   ├── services/             # 核心业务逻辑
│   │   ├── llm/              # LLM服务实现（工厂模式）
│   │   │   ├── base.ts       # 基类（定义接口）
│   │   │   ├── deepseek.ts   # DeepSeek实现
│   │   │   ├── kimi.ts       # Kimi实现
│   │   │   ├── openai.ts     # OpenAI兼容实现
│   │   │   ├── qwen.ts       # 通义千问实现
│   │   │   ├── wenxin.ts     # 文心一言实现
│   │   │   └── factory.ts    # 工厂和服务实例管理
│   │   ├── translator.ts     # 翻译服务（缓存+API调用）
│   │   └── contentExtractor.ts # 内容提取服务
│   ├── types/                # TypeScript类型定义
│   │   ├── settings.ts       # 设置类型和存储结构
│   │   └── message.ts        # 消息通信类型
│   ├── utils/                # 工具函数
│   │   └── storage.ts        # Chrome存储操作
│   └── styles/               # 样式和CSS
├── CLAUDE.md                 # Claude Code开发指南
├── manifest.json             # Chrome扩展manifest配置
├── vite.config.ts            # Vite + CRXJS构建配置
├── tailwind.config.js        # Tailwind CSS配置
├── postcss.config.js         # PostCSS配置
├── tsconfig.json             # TypeScript配置
└── package.json              # 项目依赖

```

## 配置LLM模型

### 打开设置页面

1. 点击浏览器地址栏输入：
   ```
   chrome-extension://<your-extension-id>/src/options/index.html
   ```
   或点击插件Popup中的设置按钮

2. 在设置页选择模型并配置API凭证

### 支持的模型与配置

#### DeepSeek
- **获取API Key**: https://platform.deepseek.com/
- **API Base URL**: https://api.deepseek.com
- **Model**: deepseek-chat

#### Kimi (月之暗面)
- **获取API Key**: https://platform.moonshot.cn/
- **API Base URL**: https://api.moonshot.cn
- **Model**: moonshot-v1-8k

#### 通义千问
- **获取API Key**: https://dashscope.aliyun.com/
- **API Base URL**: https://dashscope.aliyuncs.com/compatible-mode
- **Model**: qwen-turbo

#### 文心一言
- **获取API Key和Secret**: https://cloud.baidu.com/
- **需要配置**: API Key 和 Secret Key 都必须填写
- **Model**: 自动处理，无需手动指定

#### OpenAI
- **获取API Key**: https://platform.openai.com/
- **API Base URL**: https://api.openai.com（或自定义兼容API）
- **Model**: gpt-3.5-turbo（或其他模型）

### 验证配置

1. 在设置页点击"验证API"按钮
2. 系统会发送测试请求验证凭证有效性
3. 配置验证通过后，点击"保存配置"

## 使用指南

### 页面翻译

1. 打开任意网页
2. 点击扩展图标打开Popup
3. 点击"翻译当前页面"按钮启用翻译
4. 页面内容会实时显示中英文对照
5. 再次点击关闭翻译

**提示**：翻译会缓存，刷新页面时快速翻译会使用缓存结果

### 选词翻译

1. 在网页上选中任意英文文本
2. 自动显示翻译气泡
3. 点击气泡中的"复制"将译文复制到剪贴板
4. 鼠标移开气泡时自动隐藏

### 内容提炼

1. 打开要处理的网页
2. 点击Popup中的"📝 提炼页面内容"按钮
3. 或使用快捷键 `Alt+E`
4. 等待处理，自动下载名为 `[网页标题].md` 的Markdown文件

**提炼结果包含**：
- 📄 提取的标题和结构
- 📋 200-500字的内容摘要
- 💡 3-5个核心观点
- 🔗 原始链接和元数据

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Alt+T` | 开启/关闭当前页面翻译 |
| `Alt+E` | 提炼当前页面内容为Markdown |

## 高级功能

### 翻译缓存管理

- 已翻译的文本会自动缓存到本地
- 相同文本在相同URL上的重复翻译会直接返回缓存
- 在设置页可以清除所有缓存（谨慎操作）

### 并发翻译优化

- 支持最多5个并发翻译任务
- 自动排队处理待翻译文本
- 提高大型网页的翻译速度

### 模型切换

- 在设置页或Popup中随时切换LLM模型
- 切换后立即生效
- 每个模型有独立的API配置

## 故障排除

### 翻译不工作

- **检查项**：
  - [ ] API Key是否正确配置
  - [ ] 网络连接是否正常
  - [ ] 在设置页验证API Key是否有效
  - [ ] 浏览器F12控制台查看错误信息

- **如果显示"LLM API Error"**：
  - 检查API配额是否用完
  - 确认API Key在该模型平台仍有效
  - 尝试使用其他模型

### 特定网站无法翻译

- 可能原因：网站有CSP（Content Security Policy）限制，禁止注入脚本
- 解决方案：
  - 刷新页面重新加载Content Script
  - 尝试使用选词翻译（通常不受限制）
  - 检查浏览器开发者工具中的CSP错误

### 内容提炼失败或超时

- 可能原因：
  - 页面内容过长（超过LLM的token限制）
  - 页面是动态加载的，内容未完全加载
  - API配额不足

- 解决方案：
  - 等待页面完全加载再进行提炼
  - 尝试在不同时间重新提炼
  - 检查API配额

### 选词翻译气泡不显示

- **检查项**：
  - 确保翻译已在设置中启用
  - 尝试刷新页面
  - 某些网站可能对鼠标事件有干扰

### 扩展无法加载

- 确保manifest.json有效
- 检查开发者模式是否启用
- 尝试删除扩展后重新加载

## 开发指南

### 架构设计

该扩展采用**工厂模式**和**单例模式**来管理LLM服务：
- `LLMServiceFactory`: 根据模型类型创建正确的LLM服务实例
- `getLLMService()`: 维护当前活跃的LLM服务单例，避免重复创建

### 消息通信流程

```
Popup/Content Script
    ↓
  chrome.runtime.sendMessage()
    ↓
Background Service Worker
    ↓
  Message Handler (switch statement)
    ↓
  Service Layer (Translator, ContentExtractor)
    ↓
  LLM Service (via Factory)
    ↓
  External API (DeepSeek, OpenAI, etc.)
```

### 添加新的LLM模型

1. **创建实现文件**：`src/services/llm/mymodel.ts`
   ```typescript
   import { BaseLLMService, type LLMConfig } from './base';

   export class MyModelService extends BaseLLMService {
     protected getEndpoint(): string { /* ... */ }
     protected buildHeaders(): HeadersInit { /* ... */ }
     protected buildBody(messages, options) { /* ... */ }
     protected parseResponse(data) { /* ... */ }
   }
   ```

2. **在工厂中注册**：编辑 `src/services/llm/factory.ts`
   - 在 `createService()` switch中添加case
   - 在 `getDefaultConfig()` 中添加默认配置
   - 在 `getModelDisplayName()` 中添加显示名称

3. **更新类型定义**：编辑 `src/types/settings.ts`
   - 在 `ModelType` union中添加新模型
   - 在 `Settings` 接口中添加模型配置类型

4. **测试**：
   - 运行 `npm run type-check` 验证类型
   - 在设置页配置并验证API
   - 测试翻译和内容提炼功能

### 调试技巧

**查看后台日志**：
- 打开 `chrome://extensions`
- 找到"AI Web Translator"
- 点击"Service Worker"查看后台日志

**查看选词翻译日志**：
- 右键网页 → 检查 → Console
- 查看Content Script的日志输出

**TypeScript类型检查**：
```bash
npm run type-check
```

## 性能优化

- **并发限制**：最多5个并发翻译任务，防止API限流
- **缓存策略**：URL+文本内容哈希作为缓存键，减少重复API调用
- **文本预处理**：跳过脚本、样式、代码块等无需翻译的元素
- **DOM优化**：使用Intersection Observer检测可见文本，优先翻译可见部分

## 安全说明

- ✅ **API Key存储**：所有凭证以明文存储在 `chrome.storage.local`，仅当前用户可访问（不跨浏览器同步）
- ✅ **数据传输**：所有翻译内容仅发送到配置的LLM API，不经过其他服务器
- ✅ **隐私保护**：不收集用户浏览历史、访问记录或个人数据
- ✅ **缓存安全**：缓存数据存储在本地，不会上传到云端

## 许可证

MIT

## 更新日志

### v1.0.0 (2025-12-07)
- 初始版本发布
- ✨ 支持5种LLM模型（DeepSeek、Kimi、OpenAI、通义千问、文心一言）
- 🌐 页面翻译、选词翻译、内容提炼功能
- ⚡ 快捷键支持（Alt+T、Alt+E）
- 💾 智能缓存和并发翻译优化
- 📝 完整的TypeScript类型支持
- 🎨 使用Tailwind CSS的现代UI

## 反馈与贡献

发现问题或有改进建议？

- 📋 [提交Issue](../../issues)
- 🔀 [提交Pull Request](../../pulls)

## 相关文档

- 📖 [CLAUDE.md](./CLAUDE.md) - Claude Code开发指南
- 📚 [项目文档](./docs/) - 详细技术文档

---

**Made with ❤️ for efficient web translation**
