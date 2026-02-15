/**
 * Canvas Node Manager 单元测试
 * 
 * 验证需求：5.1, 5.2, 5.3, 5.4, 5.5, 10.1-10.7
 */

import { CanvasNodeManager } from '../../src/canvas/canvas-node-manager';
import type {
	Canvas,
	CanvasTextNode,
	CanvasNode,
	CreateNodeOptions
} from '../../src/types/canvas';
import { Plugin } from 'obsidian';

// 创建模拟 Canvas 实例
function createMockCanvas(): Canvas & { data: { nodes: any[]; edges: any[] }; requestFrame: jest.Mock } {
	// 内部数据存储，模拟 canvas.data（.canvas 文件的 JSON 数据的内存表示）
	const canvasData = { nodes: [] as any[], edges: [] as any[] };

	const mockCanvas = {
		nodes: new Map(),
		edges: [],
		file: 'test.canvas',
		// canvas.data 是 Obsidian Canvas 内部的数据对象
		data: canvasData,
		createTextNode: jest.fn((options: CreateNodeOptions): CanvasTextNode => {
			const node: CanvasTextNode = {
				id: `node-${Date.now()}`,
				type: 'text',
				text: options.text || '',
				x: options.pos.x,
				y: options.pos.y,
				width: options.size.width,
				height: options.size.height
			};
			return node;
		}),
		requestSave: jest.fn(),
		requestFrame: jest.fn()
	} as unknown as Canvas & { data: { nodes: any[]; edges: any[] }; requestFrame: jest.Mock };
	
	return mockCanvas;
}

// 创建模拟 Plugin 实例
function createMockPlugin(): Plugin {
	return {
		app: {
			workspace: {
				getActiveViewOfType: jest.fn()
			}
		}
	} as unknown as Plugin;
}

describe('CanvasNodeManager', () => {
	let manager: CanvasNodeManager;
	let mockPlugin: Plugin;
	
	beforeEach(() => {
		mockPlugin = createMockPlugin();
		manager = new CanvasNodeManager(mockPlugin);
	});
	
	describe('createTextNode', () => {
		// 验证需求：5.1, 10.3
		// 验证属性：属性 11
		test('应该创建文本节点', () => {
			const canvas = createMockCanvas();
			
			const node = manager.createTextNode(
				canvas,
				'Test content',
				100,
				200,
				400,
				200
			);
			
			// 验证节点创建
			expect(node).toBeDefined();
			expect(node.type).toBe('text');
			expect(node.text).toBe('Test content');
		});
		
		test('应该设置正确的节点位置', () => {
			const canvas = createMockCanvas();
			
			const node = manager.createTextNode(
				canvas,
				'Test',
				150,
				300,
				400,
				200
			);
			
			// 验证位置
			expect(node.x).toBe(150);
			expect(node.y).toBe(300);
		});
		
		test('应该设置正确的节点大小', () => {
			const canvas = createMockCanvas();
			
			const node = manager.createTextNode(
				canvas,
				'Test',
				0,
				0,
				500,
				250
			);
			
			// 验证大小
			expect(node.width).toBe(500);
			expect(node.height).toBe(250);
		});
		
		test('应该调用 Canvas API 的 createTextNode 方法', () => {
			const canvas = createMockCanvas();
			
			manager.createTextNode(
				canvas,
				'Test content',
				100,
				200,
				400,
				200
			);
			
			// 验证 Canvas API 被调用（save: false 避免触发 requestSave → getData 崩溃）
			expect(canvas.createTextNode).toHaveBeenCalledWith({
				pos: { x: 100, y: 200 },
				size: { width: 400, height: 200 },
				text: 'Test content',
				focus: false,
				save: false
			});
		});
		
		test('应该处理空文本内容', () => {
			const canvas = createMockCanvas();
			
			const node = manager.createTextNode(
				canvas,
				'',
				0,
				0,
				400,
				200
			);
			
			expect(node.text).toBe('');
		});
		
		test('应该处理加载状态文本', () => {
			const canvas = createMockCanvas();
			
			const node = manager.createTextNode(
				canvas,
				'⏳ 正在思考...',
				0,
				0,
				400,
				200
			);
			
			expect(node.text).toBe('⏳ 正在思考...');
		});
	});
	
	describe('createEdge', () => {
		// 验证需求：5.2, 10.5
		// 验证属性：属性 12
		test('应该通过 data.edges 创建节点之间的连接', () => {
			const canvas = createMockCanvas();
			
			const fromNode: CanvasTextNode = {
				id: 'node-1',
				type: 'text',
				text: 'From node',
				x: 0,
				y: 0,
				width: 100,
				height: 100
			};
			
			const toNode: CanvasTextNode = {
				id: 'node-2',
				type: 'text',
				text: 'To node',
				x: 0,
				y: 150,
				width: 100,
				height: 100
			};
			
			manager.createEdge(canvas, fromNode, toNode);
			
			// 验证 data.edges 中添加了新的边
			expect(canvas.data.edges).toHaveLength(1);
			expect(canvas.data.edges[0].fromNode).toBe('node-1');
			expect(canvas.data.edges[0].toNode).toBe('node-2');
			expect(canvas.data.edges[0].fromSide).toBe('bottom');
			expect(canvas.data.edges[0].toSide).toBe('top');
			
			// 验证 requestFrame 被调用（不调用 requestSave，因为它内部调用 getData 会崩溃）
			expect(canvas.requestFrame).toHaveBeenCalled();
		});
		
		test('应该生成唯一的边 ID', () => {
			const canvas = createMockCanvas();
			
			const fromNode: CanvasTextNode = {
				id: 'trigger',
				type: 'text',
				text: 'Trigger',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			const toNode: CanvasTextNode = {
				id: 'response',
				type: 'text',
				text: 'Response',
				x: 100,
				y: 250,
				width: 400,
				height: 200
			};
			
			manager.createEdge(canvas, fromNode, toNode);
			
			expect(canvas.data.edges[0].id).toMatch(/^edge-/);
		});
		
		test('应该处理触发节点到响应节点的连接', () => {
			const canvas = createMockCanvas();
			
			// 创建触发节点
			const triggerNode = manager.createTextNode(
				canvas,
				'User question',
				100,
				100,
				200,
				100
			);
			
			// 创建响应节点
			const responseNode = manager.createTextNode(
				canvas,
				'⏳ 正在思考...',
				100,
				250,
				400,
				200
			);
			
			// 创建连接
			manager.createEdge(canvas, triggerNode, responseNode);
			
			// 验证 data.edges 中添加了边
			expect(canvas.data.edges).toHaveLength(1);
			// 不验证 requestSave（内部调用 getData 会崩溃），只验证 requestFrame
			expect(canvas.requestFrame).toHaveBeenCalled();
		});
		
		test('创建边失败时不应该抛出错误', () => {
			// 创建一个没有 data.edges 的 canvas mock
			const canvas = createMockCanvas();
			(canvas as any).data = null; // 模拟 data 不可用
			
			const fromNode: CanvasTextNode = {
				id: 'node-1', type: 'text', text: '', x: 0, y: 0, width: 100, height: 100
			};
			const toNode: CanvasTextNode = {
				id: 'node-2', type: 'text', text: '', x: 0, y: 150, width: 100, height: 100
			};
			
			// 不应该抛出错误
			expect(() => manager.createEdge(canvas, fromNode, toNode)).not.toThrow();
		});
	});
	
	describe('updateNodeContent', () => {
		// 验证需求：5.3, 10.4
		// 验证属性：属性 15, 属性 17
		test('应该更新节点内容', () => {
			const canvas = createMockCanvas();
			
			const node: CanvasTextNode = {
				id: 'node-1',
				type: 'text',
				text: '⏳ 正在思考...',
				x: 0,
				y: 0,
				width: 400,
				height: 200
			};
			
			manager.updateNodeContent(canvas, node, 'Updated content');
			
			// 验证节点内容被更新
			expect(node.text).toBe('Updated content');
			
			// 验证 requestFrame 被调用（不调用 requestSave，因为它内部调用 getData 会崩溃）
			expect(canvas.requestFrame).toHaveBeenCalled();
		});
		
		test('应该支持流式更新', () => {
			const canvas = createMockCanvas();
			
			const node: CanvasTextNode = {
				id: 'node-1',
				type: 'text',
				text: '⏳ 正在思考...',
				x: 0,
				y: 0,
				width: 400,
				height: 200
			};
			
			// 模拟流式更新
			manager.updateNodeContent(canvas, node, 'Part 1');
			expect(node.text).toBe('Part 1');
			
			manager.updateNodeContent(canvas, node, 'Part 1 Part 2');
			expect(node.text).toBe('Part 1 Part 2');
			
			manager.updateNodeContent(canvas, node, 'Part 1 Part 2 Part 3');
			expect(node.text).toBe('Part 1 Part 2 Part 3');
			
			// 验证每次更新都调用了 requestFrame
			expect(canvas.requestFrame).toHaveBeenCalledTimes(3);
		});
		
		test('应该优先使用节点的 setText 方法', () => {
			const canvas = createMockCanvas();
			
			const node: CanvasTextNode = {
				id: 'node-1',
				type: 'text',
				text: '',
				x: 0,
				y: 0,
				width: 400,
				height: 200
			};
			
			// 模拟 Obsidian 内部节点对象的 setText 方法
			const setTextMock = jest.fn((text: string) => { node.text = text; });
			(node as any).setText = setTextMock;
			
			manager.updateNodeContent(canvas, node, 'Hello via setText');
			
			expect(setTextMock).toHaveBeenCalledWith('Hello via setText');
			expect(node.text).toBe('Hello via setText');
		});
		
		test('应该处理 Markdown 内容', () => {
			const canvas = createMockCanvas();
			
			const node: CanvasTextNode = {
				id: 'node-1',
				type: 'text',
				text: '',
				x: 0,
				y: 0,
				width: 400,
				height: 200
			};
			
			const markdownContent = `# 标题

这是一段文本。

- 列表项 1
- 列表项 2

\`\`\`typescript
const x = 1;
\`\`\``;
			
			manager.updateNodeContent(canvas, node, markdownContent);
			
			expect(node.text).toBe(markdownContent);
			expect(canvas.requestFrame).toHaveBeenCalled();
		});
		
		test('应该处理空内容', () => {
			const canvas = createMockCanvas();
			
			const node: CanvasTextNode = {
				id: 'node-1',
				type: 'text',
				text: 'Original content',
				x: 0,
				y: 0,
				width: 400,
				height: 200
			};
			
			manager.updateNodeContent(canvas, node, '');
			
			expect(node.text).toBe('');
			expect(canvas.requestFrame).toHaveBeenCalled();
		});
	});
	
	describe('calculateNodePosition', () => {
		// 验证需求：5.5, 10.7
		// 验证属性：属性 13
		test('应该计算正确的节点位置', () => {
			const triggerNode: CanvasTextNode = {
				id: '1',
				type: 'text',
				text: 'Trigger',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			const pos = manager.calculateNodePosition(triggerNode, 0, 150);
			
			// 验证 Y 坐标 = 触发节点 Y + 触发节点高度 + 偏移量
			expect(pos.y).toBe(100 + 100 + 150); // 350
			// 验证 X 坐标 = 触发节点 X + X 偏移量
			expect(pos.x).toBe(100 + 0); // 100
		});
		
		test('应该处理 X 轴偏移', () => {
			const triggerNode: CanvasTextNode = {
				id: '1',
				type: 'text',
				text: 'Trigger',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			const pos = manager.calculateNodePosition(triggerNode, 50, 150);
			
			expect(pos.x).toBe(150); // 100 + 50
			expect(pos.y).toBe(350); // 100 + 100 + 150
		});
		
		test('应该处理负偏移量', () => {
			const triggerNode: CanvasTextNode = {
				id: '1',
				type: 'text',
				text: 'Trigger',
				x: 200,
				y: 200,
				width: 200,
				height: 100
			};
			
			const pos = manager.calculateNodePosition(triggerNode, -50, 100);
			
			expect(pos.x).toBe(150); // 200 - 50
			expect(pos.y).toBe(400); // 200 + 100 + 100
		});
		
		test('应该处理零偏移量', () => {
			const triggerNode: CanvasTextNode = {
				id: '1',
				type: 'text',
				text: 'Trigger',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			const pos = manager.calculateNodePosition(triggerNode, 0, 0);
			
			expect(pos.x).toBe(100);
			expect(pos.y).toBe(200); // 100 + 100 + 0
		});
		
		test('应该处理不同的节点高度', () => {
			const shortNode: CanvasTextNode = {
				id: '1',
				type: 'text',
				text: 'Short',
				x: 0,
				y: 0,
				width: 200,
				height: 50
			};
			
			const tallNode: CanvasTextNode = {
				id: '2',
				type: 'text',
				text: 'Tall',
				x: 0,
				y: 0,
				width: 200,
				height: 300
			};
			
			const pos1 = manager.calculateNodePosition(shortNode, 0, 150);
			const pos2 = manager.calculateNodePosition(tallNode, 0, 150);
			
			expect(pos1.y).toBe(200); // 0 + 50 + 150
			expect(pos2.y).toBe(450); // 0 + 300 + 150
		});
	});
	
	describe('getActiveCanvas', () => {
		// 验证需求：10.1
		// 验证属性：属性 23
		test('应该在没有活跃 Canvas 时返回 null', () => {
			const canvas = manager.getActiveCanvas();
			
			expect(canvas).toBeNull();
		});
		
		test('应该调用 workspace.getActiveViewOfType', () => {
			manager.getActiveCanvas();
			
			expect(mockPlugin.app.workspace.getActiveViewOfType).toHaveBeenCalled();
		});
	});
});
