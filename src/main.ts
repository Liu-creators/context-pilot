import { Plugin } from 'obsidian';
import { AIPluginSettings, AIPluginSettingTab } from "./settings";
import { SettingsManager } from './services/settings-manager';
import { AIClient } from './services/ai-client';
import { EditorUIController } from './ui/editor-ui-controller';
import { CalloutStyleManager } from './ui/callout-style-manager';
import { AIEditorSuggest } from './suggest';
import { CommandRegistry } from './commands';
import { CanvasMenuHandler, CanvasUIController } from './canvas';

/**
 * Obsidian AI 扩展插件
 * 
 * 主插件类，负责插件的生命周期管理和模块初始化。
 * 
 * **验证需求：所有需求**
 */
export default class MyPlugin extends Plugin {
	settings: AIPluginSettings;
	settingsManager: SettingsManager;
	aiClient: AIClient;
	editorUIController: EditorUIController;
	calloutStyleManager: CalloutStyleManager;
	aiEditorSuggest: AIEditorSuggest;
	commandRegistry: CommandRegistry;
	// Canvas 功能模块
	canvasUIController?: CanvasUIController;
	canvasMenuHandler?: CanvasMenuHandler;

	async onload() {
		// 初始化设置管理器
		this.settingsManager = new SettingsManager(this);
		await this.settingsManager.loadSettings();
		this.settings = this.settingsManager.getSettings();

		// 初始化 AI 客户端
		const aiConfig = this.settingsManager.getAIConfig();
		this.aiClient = new AIClient(aiConfig);

		// 初始化 Callout 样式管理器
		this.calloutStyleManager = new CalloutStyleManager(this);
		this.calloutStyleManager.initialize();

		// 初始化编辑器 UI 控制器
		this.editorUIController = new EditorUIController(this, this.aiClient);

		// 初始化并注册 AI 编辑器建议
		this.aiEditorSuggest = new AIEditorSuggest(this.app, this, this.editorUIController);
		this.registerEditorSuggest(this.aiEditorSuggest);

		// 初始化并注册命令
		this.commandRegistry = new CommandRegistry(this, this.editorUIController);
		this.commandRegistry.registerCommands();

		// 初始化 Canvas 功能（条件初始化）
		// 验证需求：8.1, 9.1
		// 验证属性：属性 23
		this.initializeCanvasFeatures();

		// 添加设置面板
		this.addSettingTab(new AIPluginSettingTab(this.app, this));
		
		if (this.settings.debugMode) {
			console.log('[AI Plugin] 插件已加载');
		}
	}

	onunload() {
		// 清理 Canvas 资源
		// 验证需求：8.2, 10.8
		// 验证属性：属性 25
		this.cleanupCanvasFeatures();
		
		// 清理编辑器 UI 资源
		if (this.editorUIController) {
			this.editorUIController.cleanup();
		}
		
		// 清理 Callout 样式
		if (this.calloutStyleManager) {
			this.calloutStyleManager.cleanup();
		}
		
		if (this.settings.debugMode) {
			console.log('[AI Plugin] 插件已卸载');
		}
	}

	/**
	 * 保存设置
	 * 
	 * 通过 SettingsManager 保存设置，会自动进行 API 连接验证。
	 */
	async saveSettings(): Promise<void> {
		this.settingsManager.updateSettings(this.settings);
		await this.settingsManager.saveSettings();
		
		// 更新 AI 客户端配置
		const aiConfig = this.settingsManager.getAIConfig();
		this.aiClient.updateConfig(aiConfig);
		
		// 更新上下文提取器配置
		if (this.editorUIController) {
			this.editorUIController.updateContextExtractor();
		}
		
		// 更新 Callout 样式
		if (this.calloutStyleManager) {
			this.calloutStyleManager.updateStyles();
		}
	}

	/**
	 * 初始化 Canvas 功能
	 * 
	 * 条件初始化 Canvas AI 功能：
	 * - 检查 Canvas 功能是否启用
	 * - 初始化 CanvasUIController
	 * - 初始化 CanvasMenuHandler
	 * - 注册 Canvas 节点菜单
	 * 
	 * 验证需求：8.1, 8.2, 9.1
	 * 验证属性：属性 23
	 */
	private initializeCanvasFeatures(): void {
		try {
			// 检查 Canvas 功能是否启用
			// 验证需求：9.1
			if (!this.settings.canvasSettings?.enabled) {
				if (this.settings.debugMode) {
					console.log('[Canvas AI] Canvas 功能已禁用');
				}
				return;
			}

			// 初始化 CanvasUIController
			// 验证需求：8.1
			this.canvasUIController = new CanvasUIController(this, this.aiClient);

			// 初始化 CanvasMenuHandler
			// 验证需求：8.1, 2.3
			this.canvasMenuHandler = new CanvasMenuHandler(this, this.canvasUIController);

			// 注册 Canvas 节点菜单
			// 验证需求：8.2, 2.3
			// 验证属性：属性 23
			this.canvasMenuHandler.register();

			if (this.settings.debugMode) {
				console.log('[Canvas AI] Canvas 功能已初始化');
			}
		} catch (error) {
			console.error('[Canvas AI] 初始化 Canvas 功能失败:', error);
			// 不抛出错误，避免影响插件的其他功能
		}
	}

	/**
	 * 清理 Canvas 资源
	 * 
	 * 清理 Canvas AI 功能的所有资源：
	 * - 取消所有活跃的 AI 请求
	 * - 取消注册 Canvas 节点菜单
	 * - 清理事件监听器
	 * 
	 * 验证需求：8.2, 10.8
	 * 验证属性：属性 25
	 */
	private cleanupCanvasFeatures(): void {
		try {
			// 清理 CanvasUIController 资源
			// 验证需求：8.2, 10.8
			// 验证属性：属性 25
			if (this.canvasUIController) {
				this.canvasUIController.cleanup();
			}

			// 取消注册 CanvasMenuHandler
			// 验证需求：8.2, 10.8, 2.3
			// 验证属性：属性 25
			if (this.canvasMenuHandler) {
				this.canvasMenuHandler.unregister();
			}

			if (this.settings.debugMode) {
				console.log('[Canvas AI] Canvas 资源已清理');
			}
		} catch (error) {
			console.error('[Canvas AI] 清理 Canvas 资源失败:', error);
		}
	}
}
