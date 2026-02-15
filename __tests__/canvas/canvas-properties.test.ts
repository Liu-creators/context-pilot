/**
 * Canvas AI 集成 - 属性测试
 * 
 * 使用 fast-check 进行基于属性的测试，验证 Canvas AI 功能的正确性属性。
 * 
 * 验证属性：
 * - 属性 7：Enter 仅提取当前节点
 * - 属性 13：响应节点位置正确
 * - 属性 18：并发请求独立管理
 * - 其他关键属性
 */

import fc from 'fast-check';
import { CanvasContextExtractor } from '../../src/canvas/canvas-context-extractor';
import { CanvasNodeManager } from '../../src/canvas/canvas-node-manager';
import { CanvasUIController } from '../../src/canvas/canvas-ui-controller';
import type {
	Canvas,
	CanvasNode,
	CanvasTextNode,
	CanvasFileNode,
	CanvasLinkNode,
	CanvasEdge
} from '../../src/types/canvas';
import type { Plugin } from 'obsidian';
import type { AIClient } from '../../src/services/ai-client';

// ============================================================================
// 测试辅助函数
// ============================================================================

/**
 * 创建模拟 Canvas 实例
 */
function createMockCanvas(
	nodes: CanvasNode[] = [],
	edges: CanvasEdge[] = []
): Canvas {
	const nodesMap = new Map<string, CanvasNode>();
	nodes.forEach(node => nodesMap.set(node.id, node));
	
	return {
		nodes: nodesMap,
		edges: edges,
		file: 'test.canvas',
		createTextNode: jest.fn((options: any) => {
			const node: CanvasTextNode = {
				id: `node-${Date.now()}-${Math.random()}`,
				type: 'text',
				text: options.text || '',
				x: options.pos.x,
				y: options.pos.y,
				width: options.size.width,
				height: options.size.height
			};
			nodesMap.set(node.id, node);
			return node;
		}),
		createEdge: jest.fn(),
		requestSave: jest.fn()
	} as unknown as Canvas;
}

/**
 * 创建模拟插件实例
 */
function createMockPlugin(): Plugin {
	return {
		app: {
			workspace: {
				getActiveViewOfType: jest.fn()
			}
		},
		settings: {
			canvasSettings: {
				enabled: true,
				newNodeOffset: { x: 0, y: 150 },
				newNodeSize: { width: 400, height: 200 }
			}
		}
	} as unknown as Plugin;
}

/**
 * 创建模拟 AI 客户端
 */
function createMockAIClient(): AIClient {
	return {
		sendRequest: jest.fn().mockResolvedValue({
			id: 'test-response',
			content: 'Test AI response',
			model: 'gpt-3.5-turbo',
			timestamp: Date.now(),
			tokensUsed: 100,
			finishReason: 'stop'
		})
	} as unknown as AIClient;
}

// ============================================================================
// fast-check 生成器
// ============================================================================

/**
 * 生成随机文本节点
 */
const textNodeArbitrary = fc.record({
	id: fc.string({ minLength: 1, maxLength: 20 }),
	type: fc.constant('text' as const),
	text: fc.string({ minLength: 0, maxLength: 500 }),
	x: fc.integer({ min: 0, max: 2000 }),
	y: fc.integer({ min: 0, max: 2000 }),
	width: fc.integer({ min: 100, max: 800 }),
	height: fc.integer({ min: 50, max: 600 })
});

/**
 * 生成随机文件节点
 */
const fileNodeArbitrary = fc.record({
	id: fc.string({ minLength: 1, maxLength: 20 }),
	type: fc.constant('file' as const),
	file: fc.string({ minLength: 1, maxLength: 100 }).map(s => `${s}.md`),
	x: fc.integer({ min: 0, max: 2000 }),
	y: fc.integer({ min: 0, max: 2000 }),
	width: fc.integer({ min: 100, max: 800 }),
	height: fc.integer({ min: 50, max: 600 })
});

/**
 * 生成随机链接节点
 */
const linkNodeArbitrary = fc.record({
	id: fc.string({ minLength: 1, maxLength: 20 }),
	type: fc.constant('link' as const),
	url: fc.webUrl(),
	x: fc.integer({ min: 0, max: 2000 }),
	y: fc.integer({ min: 0, max: 2000 }),
	width: fc.integer({ min: 100, max: 800 }),
	height: fc.integer({ min: 50, max: 600 })
});

/**
 * 生成随机 Canvas 节点（任意类型）
 */
const canvasNodeArbitrary = fc.oneof(
	textNodeArbitrary,
	fileNodeArbitrary,
	linkNodeArbitrary
);

/**
 * 生成节点位置偏移量
 */
const offsetArbitrary = fc.record({
	x: fc.integer({ min: -500, max: 500 }),
	y: fc.integer({ min: 50, max: 500 })
});

// ============================================================================
// 属性测试
// ============================================================================

describe('Canvas 属性测试', () => {
	let extractor: CanvasContextExtractor;
	let nodeManager: CanvasNodeManager;
	let plugin: Plugin;

	beforeEach(() => {
		extractor = new CanvasContextExtractor();
		plugin = createMockPlugin();
		nodeManager = new CanvasNodeManager(plugin);
	});

	// ========================================================================
	// 属性 7：Enter 仅提取当前节点
	// ========================================================================
	
	describe('属性 7：Enter 提交应该仅包含当前节点上下文', () => {
		/**
		 * **验证需求：3.1, 4.1**
		 * 
		 * 对于任何文本节点，使用 extractCurrentNodeContext 提取的上下文应该：
		 * 1. 包含节点的文本内容
		 * 2. 不包含 "父节点" 标记
		 * 3. 不包含 "子节点" 标记
		 */
		test('对于任意文本节点，当前节点上下文不应包含父子节点标记', () => {
			fc.assert(
				fc.property(
					textNodeArbitrary,
					(node) => {
						const context = extractor.extractCurrentNodeContext(node);
						
						// 验证包含节点内容
						if (node.text && node.text.length > 0) {
							expect(context).toContain(node.text);
						}
						
						// 验证不包含父子节点标记
						expect(context).not.toContain('父节点');
						expect(context).not.toContain('子节点');
						expect(context).toContain('当前节点');
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * 对于任意类型的节点，当前节点上下文应该只包含该节点的内容表示
		 */
		test('对于任意类型节点，当前节点上下文仅包含该节点内容', () => {
			fc.assert(
				fc.property(
					canvasNodeArbitrary,
					(node) => {
						const context = extractor.extractCurrentNodeContext(node);
						const nodeContent = extractor.extractNodeContent(node);
						
						// 验证上下文包含节点内容
						expect(context).toContain(nodeContent);
						
						// 验证不包含相关节点标记
						expect(context).not.toContain('父节点');
						expect(context).not.toContain('子节点');
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	// ========================================================================
	// 属性 8：Shift+Enter 提取相关节点
	// ========================================================================
	
	describe('属性 8：Shift+Enter 提交应该包含相关节点上下文', () => {
		/**
		 * **验证需求：3.2, 4.2, 4.3**
		 * 
		 * 对于任何有父节点的节点，extractRelatedNodesContext 应该：
		 * 1. 包含当前节点内容
		 * 2. 包含所有父节点内容
		 * 3. fullContext 包含 "父节点" 标记
		 */
		test('对于有父节点的节点，相关上下文应包含父节点', () => {
			fc.assert(
				fc.property(
					textNodeArbitrary,
					textNodeArbitrary,
					(parentNode, currentNode) => {
						// 确保节点 ID 不同
						fc.pre(parentNode.id !== currentNode.id);
						
						const edge: CanvasEdge = {
							id: 'edge-1',
							fromNode: parentNode.id,
							toNode: currentNode.id
						};
						
						const canvas = createMockCanvas([parentNode, currentNode], [edge]);
						const result = extractor.extractRelatedNodesContext(canvas, currentNode);
						
						// 验证包含当前节点
						expect(result.currentNode).toBe(currentNode.text);
						
						// 验证包含父节点
						expect(result.parentNodes).toHaveLength(1);
						expect(result.parentNodes[0]).toBe(parentNode.text);
						
						// 验证 fullContext 包含标记
						expect(result.fullContext).toContain('父节点');
						expect(result.fullContext).toContain('当前节点');
					}
				),
				{ numRuns: 50 }
			);
		});

		/**
		 * 对于有子节点的节点，extractRelatedNodesContext 应该：
		 * 1. 包含当前节点内容
		 * 2. 包含所有子节点内容
		 * 3. fullContext 包含 "子节点" 标记
		 */
		test('对于有子节点的节点，相关上下文应包含子节点', () => {
			fc.assert(
				fc.property(
					textNodeArbitrary,
					textNodeArbitrary,
					(currentNode, childNode) => {
						// 确保节点 ID 不同
						fc.pre(currentNode.id !== childNode.id);
						
						const edge: CanvasEdge = {
							id: 'edge-1',
							fromNode: currentNode.id,
							toNode: childNode.id
						};
						
						const canvas = createMockCanvas([currentNode, childNode], [edge]);
						const result = extractor.extractRelatedNodesContext(canvas, currentNode);
						
						// 验证包含当前节点
						expect(result.currentNode).toBe(currentNode.text);
						
						// 验证包含子节点
						expect(result.childNodes).toHaveLength(1);
						expect(result.childNodes[0]).toBe(childNode.text);
						
						// 验证 fullContext 包含标记
						expect(result.fullContext).toContain('子节点');
						expect(result.fullContext).toContain('当前节点');
					}
				),
				{ numRuns: 50 }
			);
		});
	});

	// ========================================================================
	// 属性 9：正确识别父子节点
	// ========================================================================
	
	describe('属性 9：应该正确识别父子节点关系', () => {
		/**
		 * **验证需求：4.2, 4.3**
		 * 
		 * 对于任何节点结构，父节点数量应该等于指向该节点的边数量
		 */
		test('父节点数量应该等于 incoming edges 数量', () => {
			fc.assert(
				fc.property(
					textNodeArbitrary,
					fc.array(textNodeArbitrary, { minLength: 0, maxLength: 5 }),
					(currentNode, parentNodes) => {
						// 确保所有节点 ID 唯一
						const allIds = [currentNode.id, ...parentNodes.map(n => n.id)];
						fc.pre(new Set(allIds).size === allIds.length);
						
						// 创建从所有父节点到当前节点的边
						const edges: CanvasEdge[] = parentNodes.map((parent, i) => ({
							id: `edge-${i}`,
							fromNode: parent.id,
							toNode: currentNode.id
						}));
						
						const canvas = createMockCanvas([currentNode, ...parentNodes], edges);
						const result = extractor.extractRelatedNodesContext(canvas, currentNode);
						
						// 验证父节点数量
						expect(result.parentNodes).toHaveLength(parentNodes.length);
					}
				),
				{ numRuns: 50 }
			);
		});

		/**
		 * 子节点数量应该等于从该节点指出的边数量
		 */
		test('子节点数量应该等于 outgoing edges 数量', () => {
			fc.assert(
				fc.property(
					textNodeArbitrary,
					fc.array(textNodeArbitrary, { minLength: 0, maxLength: 5 }),
					(currentNode, childNodes) => {
						// 确保所有节点 ID 唯一
						const allIds = [currentNode.id, ...childNodes.map(n => n.id)];
						fc.pre(new Set(allIds).size === allIds.length);
						
						// 创建从当前节点到所有子节点的边
						const edges: CanvasEdge[] = childNodes.map((child, i) => ({
							id: `edge-${i}`,
							fromNode: currentNode.id,
							toNode: child.id
						}));
						
						const canvas = createMockCanvas([currentNode, ...childNodes], edges);
						const result = extractor.extractRelatedNodesContext(canvas, currentNode);
						
						// 验证子节点数量
						expect(result.childNodes).toHaveLength(childNodes.length);
					}
				),
				{ numRuns: 50 }
			);
		});
	});

	// ========================================================================
	// 属性 13：响应节点位置正确
	// ========================================================================
	
	describe('属性 13：响应节点应该在触发节点下方', () => {
		/**
		 * **验证需求：5.3**
		 * 
		 * 对于任意触发节点和偏移量，计算的新节点位置应该：
		 * 1. X 坐标 = 触发节点 X + offsetX
		 * 2. Y 坐标 = 触发节点 Y + 触发节点高度 + offsetY
		 */
		test('对于任意触发节点和偏移量，新节点位置应该正确计算', () => {
			fc.assert(
				fc.property(
					textNodeArbitrary,
					offsetArbitrary,
					(triggerNode, offset) => {
						const position = nodeManager.calculateNodePosition(
							triggerNode,
							offset.x,
							offset.y
						);
						
						// 验证 X 坐标
						expect(position.x).toBe(triggerNode.x + offset.x);
						
						// 验证 Y 坐标（在触发节点下方）
						expect(position.y).toBe(triggerNode.y + triggerNode.height + offset.y);
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * 对于任意触发节点，使用默认偏移量时，新节点应该在触发节点正下方
		 */
		test('使用默认偏移量时，新节点应该在触发节点正下方', () => {
			fc.assert(
				fc.property(
					textNodeArbitrary,
					(triggerNode) => {
						const defaultOffsetX = 0;
						const defaultOffsetY = 150;
						
						const position = nodeManager.calculateNodePosition(
							triggerNode,
							defaultOffsetX,
							defaultOffsetY
						);
						
						// X 坐标应该相同
						expect(position.x).toBe(triggerNode.x);
						
						// Y 坐标应该在下方
						expect(position.y).toBeGreaterThan(triggerNode.y);
						expect(position.y).toBe(triggerNode.y + triggerNode.height + defaultOffsetY);
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * 新节点的 Y 坐标应该始终大于触发节点的 Y 坐标（当 offsetY >= 0 时）
		 */
		test('当偏移量非负时，新节点应该在触发节点下方', () => {
			fc.assert(
				fc.property(
					textNodeArbitrary,
					fc.integer({ min: 0, max: 500 }),
					(triggerNode, offsetY) => {
						const position = nodeManager.calculateNodePosition(
							triggerNode,
							0,
							offsetY
						);
						
						// 新节点的 Y 坐标应该大于触发节点
						expect(position.y).toBeGreaterThan(triggerNode.y);
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	// ========================================================================
	// 属性 10：不同类型节点内容提取
	// ========================================================================
	
	describe('属性 10：应该正确提取不同类型节点的内容', () => {
		/**
		 * **验证需求：4.4**
		 * 
		 * 对于任意文本节点，提取的内容应该等于节点的 text 字段
		 */
		test('文本节点内容应该等于 text 字段', () => {
			fc.assert(
				fc.property(
					textNodeArbitrary,
					(node) => {
						const content = extractor.extractNodeContent(node);
						expect(content).toBe(node.text);
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * 对于任意文件节点，提取的内容应该包含文件名
		 */
		test('文件节点内容应该包含文件名', () => {
			fc.assert(
				fc.property(
					fileNodeArbitrary,
					(node) => {
						const content = extractor.extractNodeContent(node);
						const fileName = node.file.split('/').pop() || node.file;
						
						expect(content).toContain('文件:');
						expect(content).toContain(fileName);
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * 对于任意链接节点，提取的内容应该包含 URL
		 */
		test('链接节点内容应该包含 URL', () => {
			fc.assert(
				fc.property(
					linkNodeArbitrary,
					(node) => {
						const content = extractor.extractNodeContent(node);
						
						expect(content).toContain('链接:');
						expect(content).toContain(node.url);
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * 对于任意节点，提取的内容应该是非空字符串（除非是空文本节点）
		 */
		test('节点内容应该是有效字符串', () => {
			fc.assert(
				fc.property(
					canvasNodeArbitrary,
					(node) => {
						const content = extractor.extractNodeContent(node);
						
						// 内容应该是字符串
						expect(typeof content).toBe('string');
						
						// 对于非空文本节点，内容应该非空
						if (node.type === 'text' && node.text && node.text.length > 0) {
							expect(content.length).toBeGreaterThan(0);
						}
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	// ========================================================================
	// 属性 18：并发请求独立管理
	// ========================================================================
	
	describe('属性 18：并发请求应该独立管理', () => {
		/**
		 * **验证需求：7.1, 7.2, 7.4, 7.5**
		 * 
		 * 对于多个并发请求，每个请求应该：
		 * 1. 有唯一的请求 ID
		 * 2. 创建独立的响应节点
		 * 3. 独立管理（不互相干扰）
		 */
		test('多个并发请求应该创建独立的响应节点', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(
						fc.record({
							node: textNodeArbitrary,
							prompt: fc.string({ minLength: 1, maxLength: 100 })
						}),
						{ minLength: 2, maxLength: 5 }
					),
					async (requests) => {
						// 确保所有节点 ID 唯一
						const nodeIds = requests.map(r => r.node.id);
						fc.pre(new Set(nodeIds).size === nodeIds.length);
						
						const canvas = createMockCanvas(requests.map(r => r.node));
						const aiClient = createMockAIClient();
						const controller = new CanvasUIController(plugin, aiClient);
						
						// 同时提交所有请求
						const promises = requests.map(({ node, prompt }) =>
							controller.submitPrompt(canvas, node, prompt, false)
						);
						
						// 等待所有请求完成
						await Promise.all(promises);
						
						// 验证 createTextNode 被调用了正确的次数
						// 每个请求应该创建一个响应节点
						expect(canvas.createTextNode).toHaveBeenCalledTimes(requests.length);
						
						// 验证 AI 客户端被调用了正确的次数
						expect(aiClient.sendRequest).toHaveBeenCalledTimes(requests.length);
					}
				),
				{ numRuns: 20 } // 减少运行次数，因为这是异步测试
			);
		});

		/**
		 * 对于并发请求，每个请求应该有唯一的请求 ID
		 */
		test('并发请求应该有唯一的请求 ID', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.array(textNodeArbitrary, { minLength: 2, maxLength: 5 }),
					fc.string({ minLength: 1, maxLength: 50 }),
					async (nodes, prompt) => {
						// 确保所有节点 ID 唯一
						const nodeIds = nodes.map(n => n.id);
						fc.pre(new Set(nodeIds).size === nodeIds.length);
						
						const canvas = createMockCanvas(nodes);
						const aiClient = createMockAIClient();
						const controller = new CanvasUIController(plugin, aiClient);
						
						// 收集所有请求 ID
						const requestIds: string[] = [];
						
						// 模拟 AI 客户端以捕获请求 ID
						(aiClient.sendRequest as jest.Mock).mockImplementation((request: any) => {
							requestIds.push(request.id);
							return Promise.resolve({
								id: 'test-response',
								content: 'Test response',
								model: 'gpt-3.5-turbo',
								timestamp: Date.now(),
								tokensUsed: 100,
								finishReason: 'stop'
							});
						});
						
						// 同时提交所有请求
						const promises = nodes.map(node =>
							controller.submitPrompt(canvas, node, prompt, false)
						);
						
						await Promise.all(promises);
						
						// 验证所有请求 ID 唯一
						expect(new Set(requestIds).size).toBe(requestIds.length);
						
						// 验证所有请求 ID 都以 'canvas_' 开头
						requestIds.forEach(id => {
							expect(id).toMatch(/^canvas_/);
						});
					}
				),
				{ numRuns: 20 }
			);
		});
	});

	// ========================================================================
	// 其他关键属性
	// ========================================================================
	
	describe('其他关键属性', () => {
		/**
		 * 属性：节点内容提取应该是幂等的
		 * 
		 * 对于任意节点，多次提取内容应该返回相同的结果
		 */
		test('节点内容提取应该是幂等的', () => {
			fc.assert(
				fc.property(
					canvasNodeArbitrary,
					(node) => {
						const content1 = extractor.extractNodeContent(node);
						const content2 = extractor.extractNodeContent(node);
						const content3 = extractor.extractNodeContent(node);
						
						expect(content1).toBe(content2);
						expect(content2).toBe(content3);
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * 属性：位置计算应该是确定性的
		 * 
		 * 对于相同的输入，位置计算应该返回相同的结果
		 */
		test('位置计算应该是确定性的', () => {
			fc.assert(
				fc.property(
					textNodeArbitrary,
					offsetArbitrary,
					(node, offset) => {
						const pos1 = nodeManager.calculateNodePosition(node, offset.x, offset.y);
						const pos2 = nodeManager.calculateNodePosition(node, offset.x, offset.y);
						const pos3 = nodeManager.calculateNodePosition(node, offset.x, offset.y);
						
						expect(pos1).toEqual(pos2);
						expect(pos2).toEqual(pos3);
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * 属性：上下文提取应该保留节点内容
		 * 
		 * 对于任意节点，提取的上下文应该包含原始节点内容
		 */
		test('上下文提取应该保留节点内容', () => {
			fc.assert(
				fc.property(
					textNodeArbitrary,
					(node) => {
						// 跳过空文本节点
						fc.pre(node.text.length > 0);
						
						const currentContext = extractor.extractCurrentNodeContext(node);
						const canvas = createMockCanvas([node]);
						const relatedContext = extractor.extractRelatedNodesContext(canvas, node);
						
						// 两种上下文都应该包含节点内容
						expect(currentContext).toContain(node.text);
						expect(relatedContext.fullContext).toContain(node.text);
					}
				),
				{ numRuns: 100 }
			);
		});
	});
});
