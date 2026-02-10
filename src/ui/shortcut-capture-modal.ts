/**
 * 快捷键捕获模态框
 * 
 * 用于捕获用户按下的快捷键组合
 */

import { App, Modal } from 'obsidian';

export interface CapturedShortcut {
	modifiers: string[];
	key: string;
}

/**
 * 快捷键捕获模态框类
 */
export class ShortcutCaptureModal extends Modal {
	private onCapture: (shortcut: CapturedShortcut | null) => void;
	private capturedShortcut: CapturedShortcut | null = null;
	
	constructor(app: App, onCapture: (shortcut: CapturedShortcut | null) => void) {
		super(app);
		this.onCapture = onCapture;
	}
	
	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		
		// 标题
		contentEl.createEl('h2', { text: '按下快捷键' });
		
		// 说明
		contentEl.createEl('p', { 
			text: '请按下你想要设置的快捷键组合（例如：Shift+Enter, Ctrl+Enter, Alt+Enter）',
			cls: 'setting-item-description'
		});
		
		// 显示当前捕获的快捷键
		const displayEl = contentEl.createEl('div', {
			cls: 'shortcut-capture-display',
			text: '等待按键...'
		});
		displayEl.style.padding = '20px';
		displayEl.style.border = '2px solid var(--interactive-accent)';
		displayEl.style.borderRadius = '5px';
		displayEl.style.textAlign = 'center';
		displayEl.style.fontSize = '1.2em';
		displayEl.style.marginTop = '10px';
		displayEl.style.marginBottom = '10px';
		
		// 提示
		const hintEl = contentEl.createEl('p', {
			text: '支持的修饰符：Shift, Ctrl, Alt, Mod (Cmd/Ctrl)',
			cls: 'setting-item-description'
		});
		hintEl.style.fontSize = '0.9em';
		hintEl.style.color = 'var(--text-muted)';
		
		// 按钮容器
		const buttonContainer = contentEl.createEl('div');
		buttonContainer.style.display = 'flex';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.gap = '10px';
		buttonContainer.style.marginTop = '20px';
		
		// 取消按钮
		const cancelButton = buttonContainer.createEl('button', { text: '取消' });
		cancelButton.addEventListener('click', () => {
			this.onCapture(null);
			this.close();
		});
		
		// 确认按钮
		const confirmButton = buttonContainer.createEl('button', { 
			text: '确认',
			cls: 'mod-cta'
		});
		confirmButton.disabled = true;
		confirmButton.addEventListener('click', () => {
			this.onCapture(this.capturedShortcut);
			this.close();
		});
		
		// 监听键盘事件
		const keydownHandler = (evt: KeyboardEvent) => {
			evt.preventDefault();
			evt.stopPropagation();
			
			// 忽略单独的修饰符按键
			if (['Shift', 'Control', 'Alt', 'Meta'].includes(evt.key)) {
				return;
			}
			
			// 收集修饰符
			const modifiers: string[] = [];
			if (evt.shiftKey) modifiers.push('Shift');
			if (evt.ctrlKey) modifiers.push('Ctrl');
			if (evt.altKey) modifiers.push('Alt');
			if (evt.metaKey) modifiers.push('Mod');
			
			// 获取按键
			let key = evt.key;
			
			// 标准化按键名称
			if (key === ' ') key = 'Space';
			if (key.length === 1) key = key.toUpperCase();
			
			// 保存捕获的快捷键
			this.capturedShortcut = {
				modifiers,
				key
			};
			
			// 更新显示
			const shortcutText = this.formatShortcut(this.capturedShortcut);
			displayEl.setText(shortcutText);
			displayEl.style.color = 'var(--interactive-accent)';
			
			// 启用确认按钮
			confirmButton.disabled = false;
		};
		
		// 注册事件监听器
		contentEl.addEventListener('keydown', keydownHandler);
		
		// 清理函数
		this.scope.register([], 'Escape', () => {
			this.onCapture(null);
			this.close();
			return false;
		});
	}
	
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
	
	/**
	 * 格式化快捷键显示
	 */
	private formatShortcut(shortcut: CapturedShortcut): string {
		if (shortcut.modifiers.length === 0) {
			return shortcut.key;
		}
		return [...shortcut.modifiers, shortcut.key].join('+');
	}
}
