/**
 * Canvas 错误类测试
 * 
 * 测试 Canvas 特定错误类的功能和属性
 * 
 * 验证需求：8.6
 */

import {
	CanvasNotAvailableError,
	NodeOperationError,
	ContextExtractionError
} from '../../src/canvas/canvas-errors';

describe('Canvas 错误类', () => {
	describe('CanvasNotAvailableError', () => {
		test('应该创建带默认消息的错误', () => {
			const error = new CanvasNotAvailableError();
			
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(CanvasNotAvailableError);
			expect(error.message).toBe('请先打开一个 Canvas 文件');
			expect(error.retryable).toBe(false);
			expect(error.name).toBe('CanvasNotAvailableError');
		});
		
		test('应该创建带自定义消息的错误', () => {
			const customMessage = 'Canvas 功能不可用';
			const error = new CanvasNotAvailableError(customMessage);
			
			expect(error.message).toBe(customMessage);
			expect(error.retryable).toBe(false);
		});
		
		test('应该创建带详情的错误', () => {
			const message = 'Canvas 不可用';
			const details = '当前视图不是 Canvas 视图';
			const error = new CanvasNotAvailableError(message, details);
			
			expect(error.message).toBe(message);
			expect(error.details).toBe(details);
			expect(error.retryable).toBe(false);
		});
	});
	
	describe('NodeOperationError', () => {
		test('应该创建 create 操作错误', () => {
			const error = new NodeOperationError('create');
			
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(NodeOperationError);
			expect(error.message).toBe('无法创建节点');
			expect(error.operation).toBe('create');
			expect(error.retryable).toBe(true);
			expect(error.name).toBe('NodeOperationError');
		});
		
		test('应该创建 update 操作错误', () => {
			const error = new NodeOperationError('update');
			
			expect(error.message).toBe('无法更新节点内容');
			expect(error.operation).toBe('update');
			expect(error.retryable).toBe(true);
		});
		
		test('应该创建 connect 操作错误', () => {
			const error = new NodeOperationError('connect');
			
			expect(error.message).toBe('无法创建节点连接');
			expect(error.operation).toBe('connect');
			expect(error.retryable).toBe(true);
		});
		
		test('应该创建带自定义消息和节点 ID 的错误', () => {
			const customMessage = '节点创建失败';
			const nodeId = 'node-123';
			const error = new NodeOperationError('create', customMessage, nodeId);
			
			expect(error.message).toBe(customMessage);
			expect(error.operation).toBe('create');
			expect(error.nodeId).toBe(nodeId);
			expect(error.retryable).toBe(true);
		});
		
		test('应该创建带详情的错误', () => {
			const details = 'Canvas API 调用失败';
			const error = new NodeOperationError('update', undefined, 'node-456', details);
			
			expect(error.message).toBe('无法更新节点内容');
			expect(error.details).toBe(details);
			expect(error.nodeId).toBe('node-456');
		});
	});
	
	describe('ContextExtractionError', () => {
		test('应该创建 node-content 阶段错误', () => {
			const error = new ContextExtractionError('node-content');
			
			expect(error).toBeInstanceOf(Error);
			expect(error).toBeInstanceOf(ContextExtractionError);
			expect(error.message).toBe('无法提取节点内容');
			expect(error.stage).toBe('node-content');
			expect(error.retryable).toBe(false);
			expect(error.name).toBe('ContextExtractionError');
		});
		
		test('应该创建 connected-nodes 阶段错误', () => {
			const error = new ContextExtractionError('connected-nodes');
			
			expect(error.message).toBe('无法访问连接的节点');
			expect(error.stage).toBe('connected-nodes');
			expect(error.retryable).toBe(false);
		});
		
		test('应该创建 context-build 阶段错误', () => {
			const error = new ContextExtractionError('context-build');
			
			expect(error.message).toBe('无法构建上下文字符串');
			expect(error.stage).toBe('context-build');
			expect(error.retryable).toBe(false);
		});
		
		test('应该创建带自定义消息和节点 ID 的错误', () => {
			const customMessage = '节点内容为空';
			const nodeId = 'node-789';
			const error = new ContextExtractionError('node-content', customMessage, nodeId);
			
			expect(error.message).toBe(customMessage);
			expect(error.stage).toBe('node-content');
			expect(error.nodeId).toBe(nodeId);
			expect(error.retryable).toBe(false);
		});
		
		test('应该创建带详情的错误', () => {
			const details = '节点类型不支持';
			const error = new ContextExtractionError('node-content', undefined, 'node-abc', details);
			
			expect(error.message).toBe('无法提取节点内容');
			expect(error.details).toBe(details);
			expect(error.nodeId).toBe('node-abc');
		});
	});
	
	describe('错误类型检查', () => {
		test('应该能够区分不同的错误类型', () => {
			const canvasError = new CanvasNotAvailableError();
			const nodeError = new NodeOperationError('create');
			const contextError = new ContextExtractionError('node-content');
			
			expect(canvasError instanceof CanvasNotAvailableError).toBe(true);
			expect(canvasError instanceof NodeOperationError).toBe(false);
			expect(canvasError instanceof ContextExtractionError).toBe(false);
			
			expect(nodeError instanceof NodeOperationError).toBe(true);
			expect(nodeError instanceof CanvasNotAvailableError).toBe(false);
			expect(nodeError instanceof ContextExtractionError).toBe(false);
			
			expect(contextError instanceof ContextExtractionError).toBe(true);
			expect(contextError instanceof CanvasNotAvailableError).toBe(false);
			expect(contextError instanceof NodeOperationError).toBe(false);
		});
		
		test('所有错误都应该是 Error 的实例', () => {
			const canvasError = new CanvasNotAvailableError();
			const nodeError = new NodeOperationError('create');
			const contextError = new ContextExtractionError('node-content');
			
			expect(canvasError instanceof Error).toBe(true);
			expect(nodeError instanceof Error).toBe(true);
			expect(contextError instanceof Error).toBe(true);
		});
	});
	
	describe('retryable 属性', () => {
		test('CanvasNotAvailableError 不应该可重试', () => {
			const error = new CanvasNotAvailableError();
			expect(error.retryable).toBe(false);
		});
		
		test('NodeOperationError 应该可重试', () => {
			const createError = new NodeOperationError('create');
			const updateError = new NodeOperationError('update');
			const connectError = new NodeOperationError('connect');
			
			expect(createError.retryable).toBe(true);
			expect(updateError.retryable).toBe(true);
			expect(connectError.retryable).toBe(true);
		});
		
		test('ContextExtractionError 不应该可重试', () => {
			const error = new ContextExtractionError('node-content');
			expect(error.retryable).toBe(false);
		});
	});
});
