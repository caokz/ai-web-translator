# 🚀 快速开始指南

## 三分钟快速上手

### 1️⃣ 安装依赖

```bash
cd E:\code\TestClaude\ai-web-translator
npm install
```

**预期结果:** node_modules目录创建，依赖安装完成

### 2️⃣ 启动开发服务

```bash
npm run dev
```

**输出示例:**
```
  ➜  Local:   http://localhost:5173/
  ➜  Vite v5.0.7 built-in preview server running at:
```

**Vite会监听文件变化，自动重新构建到 `dist/`**

### 3️⃣ 在Chrome中加载扩展

#### 方式A: 手动加载 (推荐开发)

1. 打开 `chrome://extensions/`
2. 右上角开启 **"开发者模式"**
3. 点击 **"加载已解压的扩展程序"**
4. 选择 `E:\code\TestClaude\ai-web-translator\dist` 文件夹

#### 方式B: 自动刷新 (推荐使用)

每次修改代码后：
1. Vite自动构建到dist
2. 在扩展页面点击刷新按钮
3. 刷新测试网页查看变化

### 4️⃣ 配置API Key

1. 点击浏览器工具栏的扩展图标
2. 点击 **"设置"** 按钮
3. 选择一个模型 (推荐: DeepSeek)
4. 填入API Key
5. 点击 **"验证API Key"** 测试
6. 点击 **"保存配置"**

### 5️⃣ 测试功能

#### 测试翻译
1. 访问任何英文网站
2. 点击扩展图标，启用 **"翻译当前页面"**
3. 查看页面是否显示中英对照

#### 测试划词翻译
1. 在网页上选中任何英文
2. 自动显示翻译气泡
3. 点击复制按钮

#### 测试内容提炼
1. 打开英文文章
2. 点击扩展图标的 **"📝 提炼页面内容"** 按钮
3. 等待生成，自动下载Markdown文件

---

## 🔧 开发命令

```bash
# 启动开发服务 (监听文件变化)
npm run dev

# 生产构建 (压缩优化)
npm run build

# TypeScript类型检查
npm run type-check
```

---

## 📁 项目结构速览

```
ai-web-translator/
├── src/
│   ├── background/     ← Service Worker (后台进程)
│   ├── content/        ← Content Script (网页注入)
│   ├── popup/          ← Popup界面
│   ├── options/        ← Settings设置页
│   ├── services/       ← 业务逻辑
│   │   └── llm/       ← 大模型API (DeepSeek/Kimi/etc)
│   └── types/         ← TypeScript类型定义
├── dist/               ← 构建输出 (Chrome加载此目录)
├── manifest.json       ← 扩展配置
└── vite.config.ts      ← 构建配置
```

---

## 🤔 常见问题

### Q: 修改代码后不生效？
**A:**
1. 检查Vite是否在 `npm run dev` 中
2. 在Chrome扩展页面点击刷新按钮
3. 刷新测试网页

### Q: API Key保存不了？
**A:**
1. 检查API Key是否正确
2. 查看浏览器控制台(F12)是否有错误
3. 确保已启用Content Script权限

### Q: 翻译不工作？
**A:**
1. 确认API Key已配置并验证通过
2. 检查网络连接
3. 查看是否超出API配额
4. 尝试重新加载扩展

### Q: 页面加载很慢？
**A:**
1. 首次翻译较慢，已翻译内容会缓存
2. 检查LLM API响应速度
3. 尝试更换模型

---

## 🎯 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Alt+T` | 开启/关闭页面翻译 |
| `Alt+E` | 提炼当前页面内容 |

---

## 📚 获取API Key

### DeepSeek (推荐)
- 网址: https://platform.deepseek.com/
- 免费额度: 有
- 中文支持: 优秀

### Kimi (月之暗面)
- 网址: https://platform.moonshot.cn/
- 长文本: 支持128K
- 中文支持: 优秀

### 通义千问
- 网址: https://dashscope.aliyun.com/
- 速度: 快
- 中文支持: 优秀

### 文心一言
- 网址: https://cloud.baidu.com/
- 国内访问: 稳定
- 需要: API Key + Secret Key

### OpenAI
- 网址: https://platform.openai.com/
- 质量: 最好
- 成本: 较高

---

## 🐛 调试技巧

### 查看Service Worker日志
1. `chrome://extensions/`
2. 找到本扩展，点击 **"Service Worker"** 下的日志链接
3. 查看后台脚本输出

### 查看Content Script日志
1. F12打开开发者工具
2. 选择 **"Sources"** 标签
3. 左侧找到扩展ID
4. 查看content script输出

### 查看Popup日志
1. 右键扩展图标
2. 选择 **"检查弹出内容"**
3. F12打开开发者工具

---

## 💾 文件编辑后的工作流

1. **修改代码**
   ```
   编辑 src/content/index.ts 或其他文件
   ↓
   Vite自动构建 (npm run dev)
   ↓
   输出到 dist/ 目录
   ```

2. **在Chrome中生效**
   ```
   打开 chrome://extensions/
   ↓
   点击扩展下的刷新按钮
   ↓
   刷新测试网页查看变化
   ```

---

## 📊 构建和部署

### 本地测试
```bash
npm run build
# 加载 dist/ 到Chrome测试
```

### 生产发布
```bash
npm run build
# 可以：
# 1. 打包为.crx文件发布
# 2. 上传到Chrome Web Store
# 3. 发布到GitHub Releases
```

---

## 🎓 下一步学习

- 📖 阅读 `README.md` 了解完整功能
- 📚 查看 `docs/PRD.md` 理解产品设计
- 🏗️ 查看 `docs/technical-design.md` 理解技术架构
- 🔌 查看 `docs/api-design.md` 理解API接口

---

## 🆘 获取帮助

1. **查看README和文档** - 大部分问题都有说明
2. **查看浏览器控制台** - F12查看错误日志
3. **检查manifest.json** - 确保权限配置正确
4. **查看Service Worker日志** - 后台进程执行情况

---

**现在您已准备好开始开发！祝您编码愉快！ 🎉**

