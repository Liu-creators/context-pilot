import { App, FuzzySuggestModal, TFile, FuzzyMatch } from 'obsidian';

export class FileSuggestModal extends FuzzySuggestModal<TFile> {
	private onChoose: (file: TFile) => void;

	constructor(app: App, onChoose: (file: TFile) => void) {
		super(app);
		this.onChoose = onChoose;
		this.setPlaceholder('选择文件...');
		
		// 自定义建议弹窗的类名，用于样式定制
		this.modalEl.addClass('ai-file-suggest-modal');
	}

	onOpen(): void {
		super.onOpen();
		// 移除默认的 prompt 指引文本
		this.setInstructions([]);
		
		// 彻底隐藏关闭按钮
		// 有时候 CSS 可能不生效（因为 Obsidian 的内部样式优先级），我们直接在 DOM 上操作
		const closeBtn = this.modalEl.querySelector('.modal-close-button');
		if (closeBtn) {
			(closeBtn as HTMLElement).style.display = 'none';
		}

		// 暴力隐藏 prompt 区域的所有可能子元素
		const promptEl = this.modalEl.querySelector('.prompt');
		if (promptEl) {
			(promptEl as HTMLElement).style.display = 'none';
			promptEl.querySelectorAll('*').forEach(el => {
				(el as HTMLElement).style.display = 'none';
			});
		}
		
		// 再次尝试移除 footer（如果它是动态生成的）
		const footer = this.modalEl.querySelector('.ai-file-suggest-footer');
		if (footer) {
			footer.remove();
		}
		
		// 移除搜索框 input 元素，因为我们直接使用 CanvasInputModal 的输入
		// 注意：FuzzySuggestModal 依赖 inputEl 进行搜索，我们不能直接移除它
		// 而是隐藏它，并将外部输入的字符同步进来
		
		// 底部辅助提示栏暂时移除，待功能实现后再添加
		/*
		const footer = this.modalEl.createDiv({ cls: 'ai-file-suggest-footer' });
		footer.createSpan({ cls: 'ai-file-suggest-footer-item', text: '输入 # 可以链接到标题' });
		footer.createSpan({ cls: 'ai-file-suggest-footer-item', text: '输入 ^ 链接文本块' });
		footer.createSpan({ cls: 'ai-file-suggest-footer-item', text: '输入 | 指定显示的文本' });
		*/
	}

	getItems(): TFile[] {
		return this.app.vault.getFiles();
	}

	getItemText(item: TFile): string {
		return item.path;
	}

	renderSuggestion(match: FuzzyMatch<TFile>, el: HTMLElement): void {
		const file = match.item;
		
		// 创建主内容（文件名）
		el.createDiv({ 
			text: file.basename,
			cls: 'suggestion-content'
		});
		
		// 创建辅助内容（路径）
		if (file.parent && file.parent.path !== '/') {
			el.createDiv({ 
				text: file.parent.path, 
				cls: 'suggestion-note'
			});
		}
	}

	onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
		this.onChoose(item);
	}
}
