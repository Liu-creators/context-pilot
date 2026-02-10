# AI Companion

> 你的 AI 写作伙伴 - 为 Obsidian 提供智能辅助功能

AI Companion 是一个 Obsidian 插件，通过 AI 技术为你的写作和思维整理提供智能辅助。它不会替你写作，而是作为你的伙伴，在需要时提供建议、灵感和帮助。

## ✨ 核心特性

### 📝 编辑器智能辅助

- **快速触发**：在编辑器中输入 `/` 即可唤起 AI 助手
- **实时建议**：输入问题后立即获得 AI 响应
- **上下文感知**：支持多种上下文模式
  - 无上下文：纯粹的问答
  - 包含上文：AI 会参考光标前的内容
  - 遵循设置：根据你的配置自动选择上下文范围

### 🎨 Canvas 画布集成 🚧

> ⚠️ **开发中**：Canvas 功能正在开发中，暂未完全实现

- 在 Canvas 节点中同样可以使用 `/` 触发 AI（计划中）
- 支持在思维导图和画布中进行 AI 辅助创作（计划中）
- 与编辑器保持一致的交互体验（计划中）

### ⌨️ 灵活的快捷键系统

- **可自定义快捷键**：为不同的上下文模式配置专属快捷键
- **默认配置**：
  - `Enter`：无上下文提交
  - `Shift+Enter`：包含光标前上文
  - `Cmd/Ctrl+Enter`：遵循设置配置
- 在设置中可视化配置快捷键组合

### 🎯 命令面板支持

- **触发 AI 输入**：通过命令面板快速唤起 AI
- **使用选中文本询问 AI**：选中文本后直接提问

### 🎨 美观的 UI 设计

- **Callout 样式响应**：AI 响应以美观的 Callout 块显示
- **可自定义颜色**：支持自定义 AI 响应块的颜色主题
- **加载动画**：优雅的加载指示器
- **错误提示**：清晰的错误信息展示

## 🚀 快速开始

### 安装

1. 下载最新版本的 `main.js`、`manifest.json` 和 `styles.css`
2. 在你的 Vault 中创建文件夹：`<Vault>/.obsidian/plugins/obsidian-ai-companion/`
3. 将下载的文件复制到该文件夹
4. 重启 Obsidian
5. 在 **设置 → 社区插件** 中启用 AI Companion

### 配置 AI 服务

1. 打开 **设置 → AI Companion**
2. 配置你的 AI 服务：
   - **API 端点**：你的 AI 服务地址
   - **API 密钥**：你的 API 密钥
   - **模型名称**：使用的模型（如 `gpt-4`）
3. 点击 **测试连接** 验证配置

### 基本使用

1. 在编辑器中输入 `/`
2. 输入你的问题或需求
3. 按 `Enter` 提交（或使用其他配置的快捷键）
4. AI 响应会以 Callout 块的形式插入到光标位置

## 📖 使用场景

### 写作辅助

```
/帮我扩展这段话的论述
/这段文字有什么可以改进的地方
/用更专业的语言重写这段内容
```

### 思维整理

```
/总结上面的要点
/从这些内容中提取关键信息
/帮我理清这些概念之间的关系
```

### 知识问答

```
/解释一下量子纠缠的原理
/TypeScript 中的泛型是什么
/比较一下这两种方法的优缺点
```

## ⚙️ 高级配置

### 上下文提取设置

- **提取模式**：
  - 光标前所有内容
  - 当前段落
  - 当前标题下的内容
  - 整个文档
- **最大 Token 数**：控制发送给 AI 的上下文长度
- **包含元数据**：是否包含文件名、标签等信息

### 快捷键自定义

在设置中可以为每种上下文模式配置独立的快捷键组合：

- 选择修饰键（Ctrl、Shift、Alt、Cmd）
- 选择主键
- 关联上下文类型

### 样式自定义

- 自定义 AI 响应 Callout 的颜色
- 支持 RGB 和 HEX 颜色格式
- 实时预览效果

## 🔧 开发

### 环境要求

- Node.js 18+
- npm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 测试

```bash
npm run test
npm run test:coverage
```

### 代码检查

```bash
npm run lint
```

## 📁 项目结构

```
src/
├── main.ts                 # 插件入口
├── settings.ts             # 设置界面
├── commands/               # 命令注册
├── services/               # 核心服务
│   ├── ai-client.ts       # AI 客户端
│   ├── request-queue.ts   # 请求队列
│   └── response-parser.ts # 响应解析
├── ui/                     # UI 组件
│   ├── editor-ui-controller.ts
│   ├── loading-indicator.ts
│   └── error-display.ts
├── suggest/                # 建议系统
│   └── ai-editor-suggest.ts
├── canvas/                 # Canvas 集成（开发中）
│   ├── canvas-trigger-handler.ts
│   └── canvas-ui-controller.ts
└── utils/                  # 工具函数
    ├── context-extractor.ts
    └── error-handler.ts
```

## 🔒 隐私与安全

- **本地优先**：插件本身不收集任何数据
- **API 通信**：仅在你主动触发时才与配置的 AI 服务通信
- **数据控制**：你完全控制发送给 AI 的内容
- **透明配置**：所有设置都在本地，清晰可见

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

0-BSD License

## 🙏 致谢

感谢 Obsidian 社区的支持和反馈。

---

**注意**：此插件需要配置有效的 AI 服务才能使用。请确保你有可用的 API 端点和密钥。
