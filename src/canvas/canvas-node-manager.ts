/**
 * Canvas Node Manager
 * 
 * 负责管理 Canvas 节点的创建、更新和连接
 * 
 * 验证需求：5.1, 5.2, 5.3, 5.4, 5.5, 10.1-10.7
 */

import { Plugin, View, Notice } from 'obsidian';
import type { Canvas, CanvasTextNode, CanvasNode } from '../types/canvas';
import { isCanvasView } from '../types/canvas-guards';

/**
 * Canvas 节点管理器
 * 
 * 提供 Canvas 节点的创建、更新、连接等操作。
 * 
 * @example
 * ```ts
 * const manager = new CanvasNodeManager(plugin);
 * const canvas = manager.getActiveCanvas();
 * if (canvas) {
 *   const node = manager.createTextNode(canvas, 'Hello', 0, 0, 200, 100);
 * }
 * ```
 */
export class CanvasNodeManager {
	private plugin: Plugin;

	/**
	 * 构造函数
	 * 
	 * @param plugin 插件实例
	 * 
	 * 验证需求：5.1
	 */
	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	/**
	 * 获取当前活跃的 Canvas
	 * 
	 * 尝试从当前活跃的视图中获取 Canvas 实例。
	 * 如果当前视图不是 Canvas 视图，返回 null。
	 * 
	 * @returns Canvas 实例，如果不可用则返回 null
	 * 
	 * 验证需求：10.1, 属性 23
	 * 
	 * @example
	 * ```ts
	 * const canvas = manager.getActiveCanvas();
	 * if (canvas) {
	 *   console.log('Canvas 可用，节点数量:', canvas.nodes.size);
	 * } else {
	 *   console.log('当前没有打开 Canvas');
	 * }
	 * ```
	 */
	getActiveCanvas(): Canvas | null {
		// 获取当前活跃的视图
		const activeView = this.plugin.app.workspace.getActiveViewOfType(View);
		
		// 检查是否为 Canvas 视图
		if (activeView && isCanvasView(activeView)) {
			return activeView;
		}
		
		return null;
	}

	/**
	 * 创建文本节点
	 * 
	 * 在 Canvas 中创建一个新的文本节点，并设置其位置、大小和内容。
	 * 
	 * @param canvas Canvas 实例
	 * @param content 节点文本内容
	 * @param x X 坐标
	 * @param y Y 坐标
	 * @param width 节点宽度
	 * @param height 节点高度
	 * @returns 创建的文本节点
	 * 
	 * 验证需求：5.1, 10.3, 属性 11
	 * 
	 * @example
	 * ```ts
	 * const node = manager.createTextNode(
	 *   canvas,
	 *   '⏳ 正在思考...',
	 *   100, 250,
	 *   400, 200
	 * );
	 * console.log('创建的节点 ID:', node.id);
	 * ```
	 */
	createTextNode(
		canvas: Canvas,
		content: string,
		x: number,
		y: number,
		width: number,
		height: number
	): CanvasTextNode {
		// 调用 Canvas API 创建文本节点
		// save: false 避免立即触发 requestSave → getData 调用链
		// 节点创建后由 Canvas 自身的事件循环处理持久化
		const node = canvas.createTextNode({
			pos: { x, y },
			size: { width, height },
			text: content,
			focus: false,
			save: false
		});
		
		// 完整性检查：确保节点实例包含 getData 方法
		if (node && typeof (node as unknown).getData !== 'function') {
			console.error('[Canvas AI] 创建的节点实例不完整（缺少 getData），可能导致保存失败', node);
			// 尝试补救：如果是纯数据对象，可能需要手动混入方法（但通常不应该发生）
		}
		
		return node;
	}

	/**
	 * 更新节点内容
	 * 
	 * 更新文本节点的内容，并触发 Canvas UI 重绘。
	 * 支持流式更新，可以多次调用以逐步更新节点内容。
	 * 
	 * 注意：传入的 canvas 实际上是 canvasView.canvas 内部对象，
	 * 不能直接调用 requestSave()（会触发 getData() 不存在的错误）。
	 * 改用 setText()（如果节点支持）+ requestFrame() 触发 UI 重绘，
	 * Canvas 自身的自动保存机制会处理持久化。
	 * 
	 * @param canvas Canvas 实例（实际是 canvasView.canvas 内部对象）
	 * @param node 要更新的文本节点
	 * @param content 新的文本内容
	 * 
	 * 验证需求：5.3, 10.4, 属性 15, 属性 17
	 * 
	 * @example
	 * ```ts
	 * // 初始加载状态
	 * manager.updateNodeContent(canvas, node, '⏳ 正在思考...');
	 * 
	 * // 流式更新
	 * manager.updateNodeContent(canvas, node, '这是部分响应...');
	 * 
	 * // 最终完整内容
	 * manager.updateNodeContent(canvas, node, '这是完整的 AI 响应内容');
	 * ```
	 */
	updateNodeContent(canvas: Canvas, node: CanvasTextNode, content: string): void {
		const nodeAny = node as unknown;
		const canvasAny = canvas as unknown;
		
		// 优先使用节点的 setText() 方法（Obsidian 内部节点对象通常有此方法）
		// setText 会同时更新内部数据和 DOM 渲染
		if (typeof nodeAny.setText === 'function') {
			nodeAny.setText(content);
		} else {
			// 回退：直接设置 text 属性
			node.text = content;
		}
		
		// 触发 Canvas UI 重绘
		if (typeof canvasAny.requestFrame === 'function') {
			canvasAny.requestFrame();
		}

		// 注意：不要在此处调用 requestSave()
		// 1. 如果 Canvas 中存在格式不正确的对象（如之前版本产生的无效边），requestSave() 会导致崩溃
		// 2. Canvas 自身有自动保存机制（debounced save），会在适当时机持久化数据
		// 3. 频繁调用 requestSave() 也会影响性能
	}

	/**
	 * 计算连线方向
	 * 
	 * 根据两个节点的相对位置，决定连线的起点和终点方向。
	 */
	private determineEdgeSides(fromNode: CanvasNode, toNode: CanvasNode): { fromSide: 'top' | 'right' | 'bottom' | 'left', toSide: 'top' | 'right' | 'bottom' | 'left' } {
		const dx = toNode.x - fromNode.x;
		const dy = toNode.y - fromNode.y;

		if (Math.abs(dx) > Math.abs(dy)) {
			// 水平方向为主
			return dx > 0
				? { fromSide: 'right', toSide: 'left' }
				: { fromSide: 'left', toSide: 'right' };
		} else {
			// 垂直方向为主
			return dy > 0
				? { fromSide: 'bottom', toSide: 'top' }
				: { fromSide: 'top', toSide: 'bottom' };
		}
	}

	/**
	 * 创建连接
	 * 
	 * 在两个节点之间创建连接（边）。
	 * 
	 * 采用数据驱动模式 (Data-Driven)：
	 * 1. 获取当前 Canvas 数据
	 * 2. 构造新的连线 JSON 对象
	 * 3. 注入新数据并触发重绘
	 * 
	 * 这种方式绕过了不稳定的内部 API (createEdge/addEdge)，直接操作底层数据模型。
	 * 
	 * @param canvas Canvas 实例
	 * @param fromNode 源节点（触发节点）
	 * @param toNode 目标节点（响应节点）
	 * @param label 连线上的标签（可选）
	 * 
	 * 验证需求：5.2, 10.5, 属性 12
	 */
	createEdge(canvas: Canvas, fromNode: CanvasNode, toNode: CanvasNode, label?: string): void {
		try {
			// 计算方向
			const sides = this.determineEdgeSides(fromNode, toNode);

			// 使用 Canvas 内部 API 创建连接
			// 这种方式比 importData 更安全，因为它不会导致整个 Canvas 重绘
			const edge = canvas.createEdge(fromNode, toNode, {
				fromSide: sides.fromSide,
				toSide: sides.toSide
			});

			// 设置标签
			if (label) {
				const edgeAny = edge as unknown;
				if (typeof edgeAny.setText === 'function') {
					edgeAny.setText(label);
				} else {
					edge.label = label;
				}
			}

			// 请求保存
			canvas.requestSave();

			console.log('[Canvas AI] 连线创建成功 (API)', edge.id);

		} catch (error) {
			console.error('[Canvas AI] 创建边失败:', error);
			// 尝试降级方案：数据驱动模式 (Data-Driven)
			try {
				console.log('[Canvas AI] 尝试降级使用 Data-Driven 模式创建连接');
				// 生成唯一 ID
				const edgeId = `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
				
				// 获取当前数据
				const data = canvas.getData();

				if (!data) {
					throw new Error('无法获取 Canvas 数据');
				}

				// 构造新连线
				// 重新计算方向（以防万一）
				const sides = this.determineEdgeSides(fromNode, toNode);
				
				const newEdge = {
					id: edgeId,
					fromNode: fromNode.id,
					fromSide: sides.fromSide,
					toNode: toNode.id,
					toSide: sides.toSide,
					label: label || ''
				};

				// 构造新数据包
				const newData = {
					nodes: data.nodes,
					edges: [...(data.edges || []), newEdge]
				};

				// 注入数据并重绘
				canvas.importData(newData);
				canvas.requestFrame();
				
				console.log('[Canvas AI] 连线创建成功 (Data-Driven)', newEdge);
			} catch (fallbackError) {
				console.error('[Canvas AI] 创建边失败 (Fallback):', fallbackError);
				new Notice('无法创建连接');
			}
		}
	}

	/**
	 * 计算新节点位置
	 * 
	 * 根据触发节点的位置和偏移量计算新节点的位置。
	 * 新节点通常放置在触发节点下方。
	 * 
	 * @param triggerNode 触发节点
	 * @param offsetX X 轴偏移量
	 * @param offsetY Y 轴偏移量
	 * @returns 新节点的位置坐标
	 * 
	 * 验证需求：5.5, 10.7, 属性 13
	 * 
	 * @example
	 * ```ts
	 * // 在触发节点下方 150 像素处创建新节点
	 * const pos = manager.calculateNodePosition(triggerNode, 0, 150);
	 * console.log('新节点位置:', pos); // { x: 100, y: 250 }
	 * ```
	 */
	calculateNodePosition(
		triggerNode: CanvasNode,
		offsetX: number,
		offsetY: number
	): { x: number; y: number } {
		// 计算新节点的 X 坐标
		// 保持与触发节点相同的 X 坐标，加上偏移量
		const x = triggerNode.x + offsetX;
		
		// 计算新节点的 Y 坐标
		// 在触发节点下方，考虑触发节点的高度和偏移量
		const y = triggerNode.y + triggerNode.height + offsetY;
		
		return { x, y };
	}
}
