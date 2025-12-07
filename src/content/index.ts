// 常量定义
const SKIP_TAGS = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'BUTTON', 'NOSCRIPT', 'KBD', 'SAMP'];
const SKIP_CLASSES = ['hljs', 'language-'];
const TRANSLATED_ATTR = 'data-ai-translated';
const TRANSLATION_CLASS = 'ai-translation-text';
const ORIGINAL_TEXT_ATTR = 'data-original-text';
const TRANSLATION_ID_ATTR = 'data-translation-id';

// 状态管理
let translationEnabled = false;
let domObserver: MutationObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let selectionTranslator: SelectionTranslator | null = null;

// 翻译任务队列
let translationQueue: Map<number, { element: Element; index: number; status: 'pending' | 'translating' | 'done' }> = new Map();
let nextTranslationId = 0;
let activeTranslations = 0;
const MAX_CONCURRENT_TRANSLATIONS = 5; // 增加到5个以提高性能

// 防止过度调用 processTranslationQueue 的标志
let pendingQueueProcess = false;

// 初始化Content Script
async function initialize() {
  console.log('🚀 Content Script initializing...');

  // 等待 DOM 完全加载
  await new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve(null);
    }
  });

  try {
    // 获取初始状态
    const response = await chrome.runtime.sendMessage({
      type: 'SYNC_STATE',
      payload: {
        tabId: -1,
        url: window.location.href
      }
    });

    translationEnabled = response.data?.translationEnabled || false;

    // 初始化选择翻译
    selectionTranslator = new SelectionTranslator();
    selectionTranslator.init();

    // 如果翻译已启用，立即初始化翻译
    if (translationEnabled) {
      initializeTranslation();
    }

    // 监听消息
    chrome.runtime.onMessage.addListener(handleMessage);

    console.log('✅ Content Script initialized');
  } catch (error) {
    console.error('❌ Error during initialization:', error);
  }
}

// 处理消息
async function handleMessage(message: any, sender: any, sendResponse: any) {
  try {
    switch (message.type) {
      case 'STATE_CHANGED':
        if (message.payload.translationEnabled !== undefined) {
          translationEnabled = message.payload.translationEnabled;
          if (translationEnabled) {
            initializeTranslation();
          } else {
            removeTranslations();
          }
        }
        sendResponse({ success: true });
        break;

      case 'TRIGGER_EXTRACT':
        triggerExtract(message.payload?.mode || 'raw');
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return true;
}

// 初始化翻译
function initializeTranslation() {
  console.log('🔄 Initializing translation...');

  // 检查document.body是否存在
  if (!document.body) {
    console.warn('⚠️ document.body not ready, retrying in 100ms...');
    setTimeout(initializeTranslation, 100);
    return;
  }

  // 清理旧的观察器
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }

  // 清理旧的DOM观察器
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }

  // 创建 Intersection Observer，监听元素进入视口
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      if (!translationEnabled) return;

      let visibleElementCount = 0;
      let hasNewPendingElements = false;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleElementCount++;
          const element = entry.target as Element;
          const id = parseInt(element.getAttribute(TRANSLATION_ID_ATTR) || '0');

          console.log(`👀 Element intersecting: id=${id}, tag=${element.tagName}`);

          if (translationQueue.has(id)) {
            const task = translationQueue.get(id)!;
            if (task.status === 'pending') {
              hasNewPendingElements = true;
            }
          }
        }
      });

      console.log(`👁️ Intersection Observer: ${visibleElementCount} elements visible, hasNewPending=${hasNewPendingElements}`);

      // 如果有新的待处理元素进入视口，立即触发处理
      // 不使用防抖延迟，这样可以提高响应速度
      if (hasNewPendingElements) {
        console.log(`🚀 Triggering translation for newly visible elements`);
        processTranslationQueue();
      }
    },
    {
      rootMargin: '300px' // 提前300px开始翻译
    }
  );

  console.log('✅ Intersection Observer created');

  // 收集所有可翻译的文本节点
  console.log('📍 About to call collectTranslatableElements()');
  collectTranslatableElements();

  // 等待一下让 Intersection Observer 初始检测完成
  console.log('⏳ Waiting for Intersection Observer initial observation...');

  // 关键设计：不主动调用 processTranslationQueue()
  // 让 Intersection Observer 完全控制翻译流程
  // 这样可以实现真正的"懒翻译"：只翻译用户正在看的内容
  // 随着用户滚动，Intersection Observer 会检测到新的元素进入视口，自动触发翻译

  // 监听DOM变化
  startDOMObserver();
}

// 收集所有可翻译的元素
function collectTranslatableElements() {
  // 确保document存在
  if (!document) {
    console.warn('⚠️ Document not ready');
    return;
  }

  try {
    const elements = document.querySelectorAll('p, li, td, th, h1, h2, h3, h4, h5, h6, span, div, a, label');
    let index = 0;
    let skippedCount = 0;

    for (const element of elements) {
      // 跳过已翻译、脚本、样式等
      if (element.hasAttribute(TRANSLATED_ATTR)) {
        skippedCount++;
        continue;
      }
      if (SKIP_TAGS.includes(element.tagName)) {
        skippedCount++;
        continue;
      }
      if (isInSkipElement(element)) {
        skippedCount++;
        continue;
      }

      // 检查是否有可翻译的内容
      const texts = getDirectTextNodes(element);
      if (texts.length === 0) {
        skippedCount++;
        continue;
      }

      const hasEnglish = texts.some(text => /[a-zA-Z]/.test(text));
      if (!hasEnglish) {
        skippedCount++;
        continue;
      }

      const trimmedTexts = texts.map(t => t.trim()).filter(t => t.length > 2);
      if (trimmedTexts.length === 0) {
        skippedCount++;
        continue;
      }

      // 添加到翻译队列
      const id = nextTranslationId++;
      element.setAttribute(TRANSLATION_ID_ATTR, id.toString());
      translationQueue.set(id, {
        element,
        index,
        status: 'pending'
      });

      console.debug(`📋 Queued element #${id}:`, {
        elementTag: element.tagName,
        textPreview: texts[0].substring(0, 30),
        textLength: texts.join(' ').length
      });

      // 观察这个元素
      intersectionObserver?.observe(element);

      index++;
    }

    console.log(`📋 Collected ${translationQueue.size} elements for translation (skipped ${skippedCount} elements)`);
  } catch (error) {
    console.error('❌ Error collecting translatable elements:', error);
  }
}

// 获取元素的直接文本节点（不包括子元素的文本）
function getDirectTextNodes(element: Element): string[] {
  const texts: string[] = [];

  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node as Text).textContent?.trim() || '';
      if (text.length > 0) {
        texts.push(text);
      }
    }
  }

  return texts;
}

// 检查元素是否在需要跳过的元素内
function isInSkipElement(element: Element): boolean {
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    if (SKIP_TAGS.includes(parent.tagName)) return true;
    if (parent.hasAttribute(TRANSLATED_ATTR)) return true;

    // 检查是否在代码块中
    const classes = parent.className;
    if (typeof classes === 'string') {
      if (SKIP_CLASSES.some(cls => classes.includes(cls))) return true;
    }

    parent = parent.parentElement;
  }
  return false;
}

// 检查元素是否在视口内（考虑 rootMargin）
function isElementInViewport(element: Element): boolean {
  try {
    const rect = element.getBoundingClientRect();
    // 考虑 Intersection Observer 的 rootMargin: 300px
    const margin = 300;
    return (
      rect.top < window.innerHeight + margin &&
      rect.bottom > -margin &&
      rect.left < window.innerWidth + margin &&
      rect.right > -margin
    );
  } catch {
    return false;
  }
}

// 处理翻译队列
async function processTranslationQueue() {
  console.log(`📊 processTranslationQueue called - translationEnabled: ${translationEnabled}, activeTranslations: ${activeTranslations}/${MAX_CONCURRENT_TRANSLATIONS}`);

  if (!translationEnabled || activeTranslations >= MAX_CONCURRENT_TRANSLATIONS) {
    if (!translationEnabled) {
      console.debug('⏸️ Translation is disabled, skipping queue');
    } else {
      console.debug(`⏳ Max concurrent translations reached (${activeTranslations}/${MAX_CONCURRENT_TRANSLATIONS})`);
    }
    return;
  }

  // 查找待翻译的任务 - 优先查找可见的 pending 任务
  let task: { element: Element; index: number; status: 'pending' | 'translating' | 'done' } | null = null;
  let taskId: number | null = null;

  // 第一轮：查找可见的待处理任务（优先级高）
  for (const [id, t] of translationQueue.entries()) {
    if (t.status === 'pending' && isElementInViewport(t.element)) {
      task = t;
      taskId = id;
      console.log(`✓ Found visible pending task #${id}`);
      break;
    }
  }

  // 第二轮：如果没有找到可见的任务，再查找任何待处理的任务
  if (!task || taskId === null) {
    for (const [id, t] of translationQueue.entries()) {
      if (t.status === 'pending') {
        task = t;
        taskId = id;
        console.log(`✓ Found off-screen pending task #${id}`);
        break;
      }
    }
  }

  if (!task || taskId === null) {
    // 所有任务完成
    if (translationQueue.size > 0) {
      console.log('✅ All translations completed (no more pending tasks)');
    }
    return;
  }

  task.status = 'translating';
  activeTranslations++;

  const isVisible = isElementInViewport(task.element);
  console.log(`🔄 Processing task #${taskId}: visible=${isVisible}, tag=${task.element.tagName}`);

  try {
    await translateElement(task.element);
  } catch (error) {
    console.error('Translation error:', error);
  } finally {
    task.status = 'done';
    activeTranslations--;

    // 继续处理队列
    setTimeout(() => processTranslationQueue(), 50);
  }
}

// 翻译单个元素
async function translateElement(element: Element) {
  const texts = getDirectTextNodes(element);
  const combinedText = texts.join(' ').trim();

  if (!combinedText || combinedText.length < 2) {
    console.debug('⏭️ Skipping element (no text or too short):', combinedText?.substring(0, 20));
    return;
  }

  try {
    console.log(`📤 Translating: "${combinedText.substring(0, 50)}..."`);

    // 发送翻译请求
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_TEXT',
      payload: {
        text: combinedText,
        targetLang: 'zh-CN'
      }
    });

    console.log('📥 Translation response:', {
      success: response.success,
      hasData: !!response.data,
      translationLength: response.data?.translation?.length || 0
    });

    if (response.success && response.data?.translation) {
      console.log(`✅ Translation success: "${response.data.translation.substring(0, 50)}..."`);
      console.log(`📝 Inserting translation for element:`, {
        elementTag: element.tagName,
        elementId: element.id,
        originalText: combinedText.substring(0, 40),
        translationText: response.data.translation.substring(0, 40)
      });
      insertTranslation(element, response.data.translation);
    } else {
      console.warn('⚠️ Translation response not successful:', {
        success: response.success,
        error: response.error,
        data: response.data
      });
    }
  } catch (error) {
    console.error('❌ Failed to translate element:', {
      errorMessage: error instanceof Error ? error.message : String(error),
      text: combinedText.substring(0, 50),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

// 插入翻译
function insertTranslation(element: Element, translation: string) {
  // 检查翻译内容是否为空
  if (!translation || translation.trim().length === 0) {
    console.warn('⚠️ Translation is empty, skipping insertion:', {
      elementTag: element.tagName,
      elementText: element.textContent?.substring(0, 50)
    });
    return;
  }

  if (element.hasAttribute(TRANSLATED_ATTR)) {
    console.debug('⏭️ Element already translated, skipping');
    return;
  }

  // 标记为已翻译
  element.setAttribute(TRANSLATED_ATTR, 'true');
  element.setAttribute(ORIGINAL_TEXT_ATTR, element.textContent || '');

  const tagName = element.tagName.toUpperCase();
  const isTableCell = ['TD', 'TH'].includes(tagName);

  // 创建翻译容器
  const wrapper = document.createElement('div');
  wrapper.className = TRANSLATION_CLASS;

  // 根据元素类型选择合适的样式和插入位置
  const style = getTranslationStyle(element);
  wrapper.setAttribute('style', style);
  wrapper.textContent = translation;

  // 在元素后插入翻译（不破坏元素结构）
  try {
    if (isTableCell && element.parentElement) {
      // 对于表格单元格，插入到单元格内部而不是后面
      // 这样可以保持表格布局不被破坏
      element.appendChild(wrapper);
      console.log('✅ Translation inserted to DOM (inside cell):', {
        elementTag: element.tagName,
        translationLength: translation.length,
        translationPreview: translation.substring(0, 30)
      });
    } else if (element.parentElement) {
      // 对于其他元素，插入到元素后面
      element.parentElement.insertBefore(wrapper, element.nextSibling);
      console.log('✅ Translation inserted to DOM (after element):', {
        elementTag: element.tagName,
        translationLength: translation.length,
        translationPreview: translation.substring(0, 30)
      });
    } else {
      console.warn('⚠️ Element has no parent, cannot insert translation:', {
        elementTag: element.tagName,
        elementText: element.textContent?.substring(0, 50)
      });
    }
  } catch (error) {
    console.error('❌ Failed to insert translation to DOM:', {
      error: error instanceof Error ? error.message : String(error),
      elementTag: element.tagName
    });
  }
}

// 根据元素类型获取合适的翻译样式
function getTranslationStyle(element: Element): string {
  const tagName = element.tagName.toUpperCase();

  // 表格单元格需要特殊处理 - 翻译显示在单元格内
  if (['TD', 'TH'].includes(tagName)) {
    return `
      display: block;
      color: #666;
      font-size: 0.85em;
      margin-top: 0.3em;
      padding: 0.2em 0;
      border-top: 1px solid #e5e7eb;
      border-left: 2px solid #3b82f6;
      background-color: rgba(59, 130, 246, 0.05);
      font-family: inherit;
      line-height: 1.4;
      word-break: break-word;
      word-wrap: break-word;
      white-space: normal;
      overflow-wrap: break-word;
      max-width: 100%;
    `;
  }

  // 列表项需要特殊处理
  if (tagName === 'LI') {
    return `
      display: block;
      color: #666;
      font-size: 0.9em;
      margin-top: 0.2em;
      padding: 0.1em 0 0.1em 1em;
      border-left: 2px solid #3b82f6;
      background-color: rgba(59, 130, 246, 0.05);
      font-family: inherit;
      line-height: 1.5;
      word-break: break-word;
      word-wrap: break-word;
      white-space: normal;
      overflow-wrap: break-word;
    `;
  }

  // 默认样式 - 用于段落、div等块级元素
  return `
    color: #666;
    font-size: 0.9em;
    margin-top: 0.25em;
    padding: 0.25em 0.5em;
    border-left: 2px solid #3b82f6;
    background-color: rgba(59, 130, 246, 0.05);
    font-family: inherit;
    line-height: 1.5;
    word-break: break-word;
    word-wrap: break-word;
    white-space: normal;
    overflow-wrap: break-word;
  `;
}

// 监听DOM变化
function startDOMObserver() {
  if (domObserver) return;

  // 确保document.body存在
  if (!document.body) {
    console.warn('⚠️ document.body not ready for observer, retrying...');
    setTimeout(startDOMObserver, 100);
    return;
  }

  domObserver = new MutationObserver((mutations) => {
    if (!translationEnabled) return;

    // 收集新增的可翻译元素
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            // 检查这个节点和其子节点是否可翻译
            const newElements = node.querySelectorAll('p, li, td, th, h1, h2, h3, h4, h5, h6, span, div, a, label');

            for (const el of newElements) {
              if (el.hasAttribute(TRANSLATED_ATTR) || SKIP_TAGS.includes(el.tagName)) continue;
              if (isInSkipElement(el)) continue;

              const texts = getDirectTextNodes(el);
              if (texts.length === 0) continue;

              const hasEnglish = texts.some(text => /[a-zA-Z]/.test(text));
              if (!hasEnglish) continue;

              // 添加到队列
              const id = nextTranslationId++;
              el.setAttribute(TRANSLATION_ID_ATTR, id.toString());
              translationQueue.set(id, {
                element: el,
                index: translationQueue.size,
                status: 'pending'
              });

              intersectionObserver?.observe(el);
            }
          }
        }
      }
    }

    // 使用防抖防止过度调用 processTranslationQueue
    if (!pendingQueueProcess) {
      pendingQueueProcess = true;
      setTimeout(() => {
        pendingQueueProcess = false;
        console.log(`🚀 Processing queue after DOM mutation`);
        processTranslationQueue();
      }, 0);
    }
  });

  // 安全地开始观察
  try {
    domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log('✅ DOM observer started');
  } catch (error) {
    console.error('❌ Failed to start DOM observer:', error);
    domObserver = null;
  }
}

// 停止监听
function stopDOMObserver() {
  domObserver?.disconnect();
  domObserver = null;
}

// 移除所有翻译
function removeTranslations() {
  console.log('🔄 Removing all translations...');

  stopDOMObserver();

  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }

  // 移除所有翻译元素
  document.querySelectorAll(`.${TRANSLATION_CLASS}`).forEach(el => {
    el.remove();
  });

  // 清理所有标记
  document.querySelectorAll(`[${TRANSLATED_ATTR}]`).forEach(el => {
    el.removeAttribute(TRANSLATED_ATTR);
    el.removeAttribute(ORIGINAL_TEXT_ATTR);
    el.removeAttribute(TRANSLATION_ID_ATTR);
  });

  // 清空状态
  translationQueue.clear();
  nextTranslationId = 0;
  activeTranslations = 0;
  pendingQueueProcess = false;

  console.log('✅ All translations removed');
}

// 触发内容提取
async function triggerExtract(mode: string = 'raw') {
  try {
    const title = document.title || 'Document';
    const htmlContent = contentExtractorService.extractTextFromDOM(document.body);

    // 如果是原网页内容模式，在content script中直接转换为markdown
    let markdown: string;
    if (mode === 'raw') {
      markdown = htmlToMarkdown(htmlContent, title, window.location.href);
    } else {
      // AI提炼模式，发送原始内容给background处理
      const response = await chrome.runtime.sendMessage({
        type: 'EXTRACT_CONTENT',
        payload: {
          url: window.location.href,
          title,
          content: htmlContent,
          mode,
        }
      });

      if (response.success) {
        downloadMarkdown(response.data.markdown, title);
      }
      return;
    }

    // 原网页内容模式，直接下载
    downloadMarkdown(markdown, title);
  } catch (error) {
    console.error('Extract error:', error);
    alert('内容提取失败');
  }
}

// HTML转Markdown（在content script中处理，有DOM访问权限）
function htmlToMarkdown(html: string, title: string, url: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  let markdown = nodeToMarkdown(body);

  // 添加元数据
  const timestamp = new Date().toISOString();
  markdown += `\n\n---\n\n> **来源:** [${title}](${url})\n> **导出模式:** 原网页导出\n> **导出时间:** ${timestamp}\n`;

  return markdown.trim();
}

// 递归将DOM节点转换为Markdown
function nodeToMarkdown(node: Node, depth: number = 0): string {
  let markdown = '';

  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim() || '';
      if (text.length > 0) {
        markdown += text + '\n';
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tagName = el.tagName.toLowerCase();

      switch (tagName) {
        // 标题
        case 'h1':
          markdown += `# ${el.textContent?.trim()}\n\n`;
          break;
        case 'h2':
          markdown += `## ${el.textContent?.trim()}\n\n`;
          break;
        case 'h3':
          markdown += `### ${el.textContent?.trim()}\n\n`;
          break;
        case 'h4':
          markdown += `#### ${el.textContent?.trim()}\n\n`;
          break;
        case 'h5':
          markdown += `##### ${el.textContent?.trim()}\n\n`;
          break;
        case 'h6':
          markdown += `###### ${el.textContent?.trim()}\n\n`;
          break;

        // 段落
        case 'p':
          const pText = el.textContent?.trim() || '';
          if (pText.length > 0) {
            markdown += pText + '\n\n';
          }
          break;

        // 列表
        case 'ul':
        case 'ol':
          markdown += listToMarkdown(el, tagName === 'ol') + '\n';
          break;

        // 表格
        case 'table':
          markdown += tableToMarkdown(el) + '\n';
          break;

        // 代码块
        case 'pre':
        case 'code':
          const codeText = el.textContent?.trim() || '';
          if (codeText.length > 0) {
            markdown += '```\n' + codeText + '\n```\n\n';
          }
          break;

        // 块级元素
        case 'div':
        case 'section':
        case 'article':
        case 'main':
          markdown += nodeToMarkdown(el, depth + 1);
          break;

        // 行内元素
        case 'strong':
        case 'b':
          markdown += `**${el.textContent?.trim()}**`;
          break;
        case 'em':
        case 'i':
          markdown += `*${el.textContent?.trim()}*`;
          break;
        case 'a':
          const href = el.getAttribute('href') || '';
          const linkText = el.textContent?.trim() || '';
          if (href && linkText) {
            markdown += `[${linkText}](${href})`;
          } else {
            markdown += linkText;
          }
          break;

        // 分隔符
        case 'hr':
          markdown += '---\n\n';
          break;

        // 块引用
        case 'blockquote':
          const quoteLines = el.textContent?.trim().split('\n') || [];
          markdown += quoteLines.map(line => `> ${line}`).join('\n') + '\n\n';
          break;

        // 其他默认处理
        default:
          markdown += nodeToMarkdown(el, depth + 1);
      }
    }
  }

  return markdown;
}

// 列表转Markdown
function listToMarkdown(listEl: Element, isOrdered: boolean = false): string {
  let markdown = '';
  let index = 1;

  for (const li of listEl.querySelectorAll(':scope > li')) {
    const text = li.textContent?.trim() || '';
    if (text.length > 0) {
      const prefix = isOrdered ? `${index}. ` : '- ';
      markdown += prefix + text + '\n';
      if (isOrdered) index++;
    }
  }

  return markdown;
}

// 表格转Markdown
function tableToMarkdown(tableEl: Element): string {
  let markdown = '';
  const rows = tableEl.querySelectorAll('tr');

  if (rows.length === 0) return '';

  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td, th');
    const cellTexts = Array.from(cells).map(cell => cell.textContent?.trim() || '');

    markdown += '| ' + cellTexts.join(' | ') + ' |\n';

    // 在第一行后添加分隔符
    if (rowIndex === 0) {
      markdown += '| ' + cellTexts.map(() => '---').join(' | ') + ' |\n';
    }
  });

  return markdown;
}

// 下载Markdown文件
function downloadMarkdown(content: string, title: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}-${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 划词翻译
class SelectionTranslator {
  private bubble: HTMLElement | null = null;

  init() {
    document.addEventListener('mouseup', this.handleSelection.bind(this));
    document.addEventListener('mousedown', this.handleClickOutside.bind(this));
  }

  private async handleSelection(e: MouseEvent) {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length < 2) {
      return;
    }

    const range = selection?.getRangeAt(0);
    if (!range) return;

    const rect = range.getBoundingClientRect();
    await this.showBubble(text, {
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 10
    });
  }

  private async showBubble(text: string, position: { x: number; y: number }) {
    this.removeBubble();

    this.bubble = document.createElement('div');
    this.bubble.className = 'ai-selection-bubble';
    this.bubble.style.cssText = `
      position: fixed;
      left: ${position.x}px;
      top: ${position.y}px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px 12px;
      max-width: 300px;
      z-index: 999999;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-size: 14px;
    `;

    this.bubble.innerHTML = '<div style="color: #999;">翻译中...</div>';
    document.body.appendChild(this.bubble);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_TEXT',
        payload: { text }
      });

      if (this.bubble && response.success) {
        this.bubble.innerHTML = `
          <div style="margin-bottom: 8px;">${response.data.translation}</div>
          <button id="ai-copy-btn" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
          ">复制</button>
        `;

        const copyBtn = this.bubble.querySelector('#ai-copy-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(response.data.translation);
            copyBtn.textContent = '已复制';
            setTimeout(() => {
              this.removeBubble();
            }, 1000);
          });
        }
      }
    } catch (error) {
      if (this.bubble) {
        this.bubble.innerHTML = '<div style="color: #f56565;">翻译失败</div>';
      }
    }
  }

  private handleClickOutside(e: MouseEvent) {
    if (this.bubble && !this.bubble.contains(e.target as Node)) {
      this.removeBubble();
    }
  }

  private removeBubble() {
    this.bubble?.remove();
    this.bubble = null;
  }
}

// 内容提取器
const contentExtractorService = {
  extractTextFromDOM(element: Element): string {
    const clone = element.cloneNode(true) as Element;

    // 移除不需要的元素
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      '.navbar',
      '.header',
      '.footer',
      '[role="navigation"]',
      '[class*="sidebar"]',
      '[class*="comment"]',
      '[role="complementary"]'
    ];

    unwantedSelectors.forEach(selector => {
      try {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      } catch {
        // 选择器可能无效
      }
    });

    // 提取HTML内容而不是纯文本，这样可以保留结构
    return clone.innerHTML || '';
  }
};

// 启动
initialize().catch(error => {
  console.error('Failed to initialize Content Script:', error);
});
