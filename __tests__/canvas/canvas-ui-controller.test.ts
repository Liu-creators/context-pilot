/**
 * Canvas UI Controller 单元测试
 * 
 * 验证需求：6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { CanvasUIController } from '../../src/canvas/canvas-ui-controller';
import { AIClient } from '../../src/services/ai-client';
import type {
	Canvas,
	CanvasNode,
	CanvasTextNode,
	CanvasEdge,
	AIServiceConfig,
	AIRequest,
	AIResponse
} from '../../src/types';

// 模拟 Plugin
const mockPlugin = {
	settings: {
		canvasSettings: {
			enabled: true,
			newNodeOffset: { x: 0, y: 150 },
			newNodeSize: { width: 400, height: 200 }
		}
	}
} as any;

// 创建模拟 Canvas 实例
function createMockCanvas(
	nodes: CanvasNode[] = [],
	edges: CanvasEdge[] = []
): Canvas {
	const nodesMap = new Map<string, CanvasNode>();
	nodes.forEach(node => nodesMap.set(node.id, node));
	
	const createdNodes: CanvasNode[] = [];
	// 内部数据存储，模拟 canvas.data（.canvas 文件的 JSON 数据的内存表示）
	const canvasData = {
		nodes: nodes.map(n => ({ ...n })),
		edges: edges.map(e => ({ ...e })) as any[]
	};
	
	return {
		nodes: nodesMap,
		edges: [...edges],
		file: 'test.canvas',
		// canvas.data 是 Obsidian Canvas 内部的数据对象
		data: canvasData,
		createTextNode: jest.fn((data: any) => {
			const node: CanvasTextNode = {
				id: `node-${Date.now()}-${Math.random()}`,
				type: 'text',
				text: data.text,
				x: data.x,
				y: data.y,
				width: data.width,
				height: data.height
			};
			createdNodes.push(node);
			nodesMap.set(node.id, node);
			return node;
		}),
		requestSave: jest.fn(),
		requestFrame: jest.fn()
	} as any;
}

// 创建模拟 AIClient
function createMockAIClient(
	responseContent: string = 'Test response',
	shouldFail: boolean = false
): AIClient {
	const config: AIServiceConfig = {
		apiEndpoint: 'https://api.test.com',
		apiKey: 'test-key',
		model: 'test-model',
		timeout: 5000,
		maxRetries: 1
	};
	
	const client = new AIClient(config);
	
	// 模拟 sendRequest 方法
	client.sendRequest = jest.fn(async (request: AIRequest): Promise<AIResponse> => {
		if (shouldFail) {
			throw new Error('Network error');
		}
		
		// 模拟流式响应
		if (request.onStream) {
			const chunks = responseContent.split(' ');
			for (const chunk of chunks) {
				request.onStream(chunk + ' ');
				await new Promise(resolve => setTimeout(resolve, 10));
			}
		}
		
		return {
			id: request.id,
			content: responseContent,
			model: config.model,
			timestamp: Date.now(),
			tokensUsed: 100,
			finishReason: 'stop'
		};
	});
	
	return client;
}

describe('CanvasUIController', () => {
	describe('submitPrompt', () => {
		// 验证需求：6.1, 6.2
		test('应该成功提交请求并创建响应节点', async () => {
			const aiClient = createMockAIClient('Hello World');
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			const canvas = createMockCanvas();
			const triggerNode: CanvasTextNode = {
				id: 'trigger-1',
				type: 'text',
				text: 'Trigger content',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			await controller.submitPrompt(canvas, triggerNode, 'Test prompt', false);
			
			// 验证 AIClient.sendRequest 被调用
			expect(aiClient.sendRequest).toHaveBeenCalled();
			
			// 验证创建了响应节点
			expect(canvas.createTextNode).toHaveBeenCalled();
			
			// 验证通过 data.edges 创建了连接
			expect((canvas as any).data.edges.length).toBeGreaterThan(0);
		});
		
		// 验证需求：6.3
		test('应该处理流式响应', async () => {
			const aiClient = createMockAIClient('Test streaming response');
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			const canvas = createMockCanvas();
			const triggerNode: CanvasTextNode = {
				id: 'trigger-1',
				type: 'text',
				text: 'Trigger content',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			await controller.submitPrompt(canvas, triggerNode, 'Test prompt', false);
			
			// 验证 sendRequest 被调用时启用了流式响应
			const callArgs = (aiClient.sendRequest as jest.Mock).mock.calls[0][0];
			expect(callArgs.stream).toBe(true);
			expect(callArgs.onStream).toBeDefined();
		});
		
		// 验证需求：3.1, 4.1
		// 验证属性：属性 7
		test('应该在 includeRelated=false 时仅提取当前节点上下文', async () => {
			const aiClient = createMockAIClient('Response');
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			const canvas = createMockCanvas();
			const triggerNode: CanvasTextNode = {
				id: 'trigger-1',
				type: 'text',
				text: 'Trigger content',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			await controller.submitPrompt(canvas, triggerNode, 'Test prompt', false);
			
			// 验证请求的上下文仅包含当前节点
			const callArgs = (aiClient.sendRequest as jest.Mock).mock.calls[0][0];
			expect(callArgs.context).toContain('当前节点内容');
			expect(callArgs.context).toContain('Trigger content');
			expect(callArgs.context).not.toContain('父节点');
			expect(callArgs.context).not.toContain('子节点');
		});
		
		// 验证需求：3.2, 4.2, 4.3
		// 验证属性：属性 8
		test('应该在 includeRelated=true 时提取相关节点上下文', async () => {
			const aiClient = createMockAIClient('Response');
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			// 创建有连接关系的节点
			const parentNode: CanvasTextNode = {
				id: 'parent',
				type: 'text',
				text: 'Parent content',
				x: 100,
				y: 0,
				width: 200,
				height: 100
			};
			
			const triggerNode: CanvasTextNode = {
				id: 'trigger',
				type: 'text',
				text: 'Trigger content',
				x: 100,
				y: 150,
				width: 200,
				height: 100
			};
			
			const childNode: CanvasTextNode = {
				id: 'child',
				type: 'text',
				text: 'Child content',
				x: 100,
				y: 300,
				width: 200,
				height: 100
			};
			
			const edges: CanvasEdge[] = [
				{ id: 'e1', fromNode: 'parent', toNode: 'trigger' },
				{ id: 'e2', fromNode: 'trigger', toNode: 'child' }
			];
			
			const canvas = createMockCanvas([parentNode, triggerNode, childNode], edges);
			
			await controller.submitPrompt(canvas, triggerNode, 'Test prompt', true);
			
			// 验证请求的上下文包含相关节点
			const callArgs = (aiClient.sendRequest as jest.Mock).mock.calls[0][0];
			expect(callArgs.context).toContain('父节点');
			expect(callArgs.context).toContain('Parent content');
			expect(callArgs.context).toContain('当前节点');
			expect(callArgs.context).toContain('Trigger content');
			expect(callArgs.context).toContain('子节点');
			expect(callArgs.context).toContain('Child content');
		});
		
		// 验证需求：5.4
		// 验证属性：属性 14
		test('应该创建初始加载状态的响应节点', async () => {
			const aiClient = createMockAIClient('Response');
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			const canvas = createMockCanvas();
			const triggerNode: CanvasTextNode = {
				id: 'trigger-1',
				type: 'text',
				text: 'Trigger content',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			await controller.submitPrompt(canvas, triggerNode, 'Test prompt', false);
			
			// 验证创建的节点初始内容是加载状态
			const createNodeCall = (canvas.createTextNode as jest.Mock).mock.calls[0][0];
			expect(createNodeCall.text).toBe('⏳ 正在思考...');
		});
		
		// 验证需求：5.3
		// 验证属性：属性 13
		test('应该在正确的位置创建响应节点', async () => {
			const aiClient = createMockAIClient('Response');
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			const canvas = createMockCanvas();
			const triggerNode: CanvasTextNode = {
				id: 'trigger-1',
				type: 'text',
				text: 'Trigger content',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			await controller.submitPrompt(canvas, triggerNode, 'Test prompt', false);
			
			// 验证响应节点位置
			const createNodeCall = (canvas.createTextNode as jest.Mock).mock.calls[0][0];
			// Y 坐标应该是 triggerNode.y + triggerNode.height + offset.y
			// 100 + 100 + 150 = 350
			expect(createNodeCall.pos.y).toBe(350);
			// X 坐标应该是 triggerNode.x + offset.x
			// 100 + 0 = 100
			expect(createNodeCall.pos.x).toBe(100);
		});
		
		// 验证需求：7.4, 7.5
		// 验证属性：属性 19
		test('应该为每个请求生成唯一的请求 ID', async () => {
			const aiClient = createMockAIClient('Response');
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			const canvas = createMockCanvas();
			const triggerNode: CanvasTextNode = {
				id: 'trigger-1',
				type: 'text',
				text: 'Trigger content',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			// 提交两个请求
			await controller.submitPrompt(canvas, triggerNode, 'Prompt 1', false);
			await controller.submitPrompt(canvas, triggerNode, 'Prompt 2', false);
			
			// 验证两个请求有不同的 ID
			const call1 = (aiClient.sendRequest as jest.Mock).mock.calls[0][0];
			const call2 = (aiClient.sendRequest as jest.Mock).mock.calls[1][0];
			
			expect(call1.id).toBeDefined();
			expect(call2.id).toBeDefined();
			expect(call1.id).not.toBe(call2.id);
			
			// 验证 ID 以 canvas_ 开头
			expect(call1.id).toMatch(/^canvas_/);
			expect(call2.id).toMatch(/^canvas_/);
		});
		
		// 验证需求：8.1, 8.2, 8.3
		test('应该在请求失败时创建错误节点', async () => {
			const aiClient = createMockAIClient('', true);
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			const canvas = createMockCanvas();
			const triggerNode: CanvasTextNode = {
				id: 'trigger-1',
				type: 'text',
				text: 'Trigger content',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			await controller.submitPrompt(canvas, triggerNode, 'Test prompt', false);
			
			// 验证创建了节点（响应节点 + 错误节点）
			expect(canvas.createTextNode).toHaveBeenCalledTimes(2);
			
			// 验证错误节点包含错误信息
			const errorNodeCall = (canvas.createTextNode as jest.Mock).mock.calls[1][0];
			expect(errorNodeCall.text).toContain('❌ AI 错误');
			expect(errorNodeCall.text).toContain('💡 提示');
		});
		
		// 验证需求：8.6
		// 验证属性：属性 22
		test('应该根据错误类型显示不同的错误信息', async () => {
			const testCases = [
				{ error: new Error('Network error'), expected: '无法连接到 AI 服务' },
				{ error: new Error('Request timeout'), expected: 'AI 服务响应超时' },
				{ error: new Error('401 Unauthorized'), expected: 'API 密钥无效或已过期' },
				{ error: new Error('429 Rate limit'), expected: 'API 调用频率超限' },
				{ error: new Error('Request cancelled'), expected: '请求已取消' }
			];
			
			for (const testCase of testCases) {
				const aiClient = createMockAIClient();
				(aiClient.sendRequest as jest.Mock).mockRejectedValueOnce(testCase.error);
				
				const controller = new CanvasUIController(mockPlugin, aiClient);
				const canvas = createMockCanvas();
				const triggerNode: CanvasTextNode = {
					id: 'trigger-1',
					type: 'text',
					text: 'Trigger content',
					x: 100,
					y: 100,
					width: 200,
					height: 100
				};
				
				await controller.submitPrompt(canvas, triggerNode, 'Test prompt', false);
				
				// 验证错误节点包含特定的错误信息
				const errorNodeCall = (canvas.createTextNode as jest.Mock).mock.calls[1][0];
				expect(errorNodeCall.text).toContain(testCase.expected);
			}
		});
		
		// 验证需求：3.5
		test('应该拒绝空输入', async () => {
			const aiClient = createMockAIClient();
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			const canvas = createMockCanvas();
			const triggerNode: CanvasTextNode = {
				id: 'trigger-1',
				type: 'text',
				text: 'Trigger content',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			await controller.submitPrompt(canvas, triggerNode, '', false);
			
			// 验证没有调用 AIClient
			expect(aiClient.sendRequest).not.toHaveBeenCalled();
		});
		
		test('应该拒绝仅包含空白字符的输入', async () => {
			const aiClient = createMockAIClient();
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			const canvas = createMockCanvas();
			const triggerNode: CanvasTextNode = {
				id: 'trigger-1',
				type: 'text',
				text: 'Trigger content',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			await controller.submitPrompt(canvas, triggerNode, '   \n\t  ', false);
			
			// 验证没有调用 AIClient
			expect(aiClient.sendRequest).not.toHaveBeenCalled();
		});
		
		test('应该在 Canvas 不可用时显示错误', async () => {
			const aiClient = createMockAIClient();
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			const triggerNode: CanvasTextNode = {
				id: 'trigger-1',
				type: 'text',
				text: 'Trigger content',
				x: 100,
				y: 100,
				width: 200,
				height: 100
			};
			
			// 传入 null 作为 canvas
			await controller.submitPrompt(null as any, triggerNode, 'Test prompt', false);
			
			// 验证没有调用 AIClient
			expect(aiClient.sendRequest).not.toHaveBeenCalled();
		});
		
		test('应该在触发节点不可用时显示错误', async () => {
			const aiClient = createMockAIClient();
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			const canvas = createMockCanvas();
			
			// 传入 null 作为 triggerNode
			await controller.submitPrompt(canvas, null as any, 'Test prompt', false);
			
			// 验证没有调用 AIClient
			expect(aiClient.sendRequest).not.toHaveBeenCalled();
		});
	});
	
	describe('cleanup', () => {
		// 验证需求：10.8
		// 验证属性：属性 25
		test('应该清理所有活跃请求', () => {
			const aiClient = createMockAIClient();
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			// cleanup 应该不抛出错误
			expect(() => controller.cleanup()).not.toThrow();
		});
		
		test('应该可以多次调用 cleanup', () => {
			const aiClient = createMockAIClient();
			const controller = new CanvasUIController(mockPlugin, aiClient);
			
			// 多次调用 cleanup 应该不抛出错误
			expect(() => {
				controller.cleanup();
				controller.cleanup();
				controller.cleanup();
			}).not.toThrow();
		});
	});
});
