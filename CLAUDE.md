# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**AI Web Translator** is a Chrome extension that provides intelligent webpage translation and content extraction using large language models (LLMs). It supports multiple LLM providers including DeepSeek, Kimi, OpenAI, 通义千问, and 文心一言.

The extension has three main features:
- **Page Translation**: Translate entire webpage content with bilingual display
- **Selection Translation**: Quick translation bubble for selected text
- **Content Extraction**: Intelligently extract and generate Markdown documents from webpage content

## Common Commands

### Development
```bash
npm install      # Install dependencies
npm run dev      # Start development server with hot reload (http://localhost:5173)
npm run type-check  # Run TypeScript type checking
```

### Build & Production
```bash
npm run build    # Build extension for production (output in dist/)
npm run preview  # Preview production build locally
```

### Testing
Currently there are no automated tests. Manual testing approach:
- Load the extension in Chrome: `chrome://extensions/` → Enable Developer Mode → Load unpacked (select `dist/` folder)
- Use browser console (F12) to view logs from Service Worker and Content Script
- API Key validation available in options page

## Architecture

### Core Components

#### Entry Points (Manifest)
- **Background Service Worker** (`src/background/index.ts`): Main event handler that processes all IPC messages, calls LLM services, manages settings and caching
- **Content Script** (`src/content/index.ts`): Injected into webpages; handles DOM manipulation, text selection detection, UI injection
- **Popup UI** (`src/popup/index.html`): Browser action popup with translation toggle and content extraction buttons
- **Options Page** (`src/options/index.html`): Settings UI for configuring LLM API credentials and model selection

#### Message-Based Communication
The extension uses Chrome's `chrome.runtime.onMessage` API for communication:
- **Popup/Content Script → Background**: Message types include `TRANSLATE_TEXT`, `EXTRACT_CONTENT`, `GET_SETTINGS`, `UPDATE_SETTINGS`, `GET_CACHE`, `SET_CACHE`, `CLEAR_CACHE`, `SYNC_STATE`
- All messages return a standardized `MessageResponse` with `success`, `data`, and optional `error` fields
- Background service keeps message channel open (returns `true`) for async handlers

#### LLM Service Layer
Located in `src/services/llm/`:
- **BaseLLMService** (`base.ts`): Abstract base class defining interface for all LLM providers with methods for `chat()`, `translate()`, `summarize()`, and `validateApiKey()`
- **Factory Pattern** (`factory.ts`): `LLMServiceFactory.createService()` instantiates the correct provider based on model type; `getLLMService()` implements singleton pattern for caching current service
- **Provider Implementations**: `deepseek.ts`, `kimi.ts`, `openai.ts`, `qwen.ts`, `wenxin.ts` each implement HTTP request building and response parsing for their respective APIs

#### Key Services
- **Translator Service** (`src/services/translator.ts`): Orchestrates translation workflow including cache lookup and API calls
- **Content Extractor Service** (`src/services/contentExtractor.ts`): Generates structured Markdown summaries from webpage content
- **Storage Service** (`src/utils/storage.ts`): Handles `chrome.storage.local` operations for settings, caching, and state persistence

#### Type Definitions
- `src/types/settings.ts`: Configuration schema including active model, API credentials for each provider, translation preferences
- `src/types/message.ts`: Message type definitions for IPC communication

### Data Flow

1. **Translation Flow**:
   - User selects text or clicks button → Content Script sends `TRANSLATE_TEXT` message
   - Background checks cache via `GET_CACHE` → If miss, calls LLM via `translatorService.translate()` → Caches result via `SET_CACHE` → Returns to Content Script
   - Content Script injects translation bubble or sidebar overlay

2. **Content Extraction Flow**:
   - User triggers extraction (button or Alt+E shortcut) → Content Script extracts DOM text and sends `EXTRACT_CONTENT` message
   - Background calls `contentExtractorService.extract()` which uses `BaseLLMService.summarize()` → Returns Markdown
   - Content Script downloads result as `.md` file

3. **Settings Flow**:
   - Options page calls `UPDATE_SETTINGS` on startup and form changes
   - Background persists to storage and invalidates LLM service singleton (via `invalidateLLMService()`)
   - API Key validation triggers single test LLM call via `validateApiKey()`

## Key Implementation Patterns

### LLM Provider Implementation
When adding a new LLM provider:
1. Create new class extending `BaseLLMService` in `src/services/llm/newmodel.ts`
2. Implement three abstract methods:
   - `getEndpoint()`: Returns API endpoint URL
   - `buildHeaders()`: Returns HTTP headers including auth (API Key format varies per provider)
   - `buildBody()`: Constructs request payload according to provider's API spec
   - `parseResponse()`: Extracts text from provider's response structure
3. Register in `LLMServiceFactory.createService()` switch statement
4. Add type to `ModelType` union in `src/types/settings.ts`

### Handling Special Providers
- **Wenxin (Baidu)**: Requires both API Key and Secret Key; uses token exchange flow instead of direct API Key auth
- **Qwen (Alibaba)**: Uses compatible OpenAI-style endpoint format
- **OpenAI-compatible**: Base URL is customizable for self-hosted alternatives

### Error Handling Pattern
All message handlers follow consistent error pattern:
- Validate input (non-empty required fields)
- Wrap service calls in try-catch
- Return standardized error response with `code` and `message` fields
- Log detailed error info to console for debugging

## Build Configuration

The build uses **Vite with CRXJS** plugin (`@crxjs/vite-plugin`):
- Entry points automatically configured from `manifest.json`
- TypeScript paths aliased with `@/*` → `src/*`
- Manifest V3 compatible
- Custom plugin copies Content Script stylesheet during build

### Output Structure
```
dist/
├── src/background/index.js
├── src/content/index.js
├── src/content/styles.css
├── src/popup/index.html
├── src/options/index.html
└── manifest.json
```

## Keyboard Shortcuts
- `Alt+T`: Toggle page translation (toggles `settings.translation.enabled`, notifies Content Script via `STATE_CHANGED` message)
- `Alt+E`: Extract page content (sends `TRIGGER_EXTRACT` message to Content Script)

Shortcuts handled in background service via `chrome.commands.onCommand` listener.

## Storage Schema
Settings stored in `chrome.storage.local` with structure:
- `activeModel`: Current selected LLM provider
- `deepseek`, `kimi`, `openai`, `qwen`, `wenxin`: Provider-specific configs with `apiKey`, `baseUrl`, `model`
- `translation`: Object with `enabled` boolean flag
- Cache entries keyed by URL+text hash for deduplication

## Debugging Tips

### Viewing Logs
- **Background Worker logs**: DevTools → Extensions → Click extension → Service Worker → Console
- **Content Script logs**: Right-click webpage → Inspect → Console (or popup page for injected content)
- **Popup logs**: Click extension popup → Right-click → Inspect → Console

### Key Debug Points
- `src/background/index.ts`: Message dispatch with detailed logging
- `src/services/llm/base.ts`: LLM API call logging in `chat()` method
- `src/utils/storage.ts`: Storage operations logging

### Type Checking
Run `npm run type-check` to catch TypeScript errors without building. Strict mode enabled with `noUnusedLocals` and `noUnusedParameters`.
