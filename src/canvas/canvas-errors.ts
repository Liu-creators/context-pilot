/**
 * Canvas 特定错误类
 * 
 * 定义了 Canvas AI 集成中使用的特定错误类型。
 * 
 * **验证需求：8.6**
 */

import { BaseAIError } from '../utils/errors';

/**
 * Canvas 不可用错误
 * 
 * 当 Canvas 视图未打开或 Canvas API 不可用时抛出
 * 可重试：否（需要用户手动打开 Canvas）
 * 
 * **验证需求：1.4**
 */
export class CanvasNotAvailableError extends BaseAIError {
	readonly retryable = false;
	
	constructor(message: string = '请先打开一个 Canvas 文件', details?: string) {
		super(message, details);
	}
}

/**
 * 节点操作错误
 * 
 * 当无法创建、更新节点或创建连接时抛出
 * 可重试：是（可能是临时问题）
 * 
 * **验证需求：8.6**
 */
export class NodeOperationError extends BaseAIError {
	readonly retryable = true;
	
	/** 操作类型 */
	readonly operation: 'create' | 'update' | 'connect';
	
	/** 节点 ID（如果适用） */
	readonly nodeId?: string;
	
	constructor(
		operation: 'create' | 'update' | 'connect',
		message?: string,
		nodeId?: string,
		details?: string
	) {
		const defaultMessages = {
			create: '无法创建节点',
			update: '无法更新节点内容',
			connect: '无法创建节点连接'
		};
		
		super(message || defaultMessages[operation], details);
		this.operation = operation;
		this.nodeId = nodeId;
	}
}

/**
 * 上下文提取错误
 * 
 * 当无法提取节点内容或访问连接的节点时抛出
 * 可重试：否（通常是数据问题）
 * 
 * **验证需求：8.6**
 */
export class ContextExtractionError extends BaseAIError {
	readonly retryable = false;
	
	/** 提取阶段 */
	readonly stage: 'node-content' | 'connected-nodes' | 'context-build';
	
	/** 节点 ID（如果适用） */
	readonly nodeId?: string;
	
	constructor(
		stage: 'node-content' | 'connected-nodes' | 'context-build',
		message?: string,
		nodeId?: string,
		details?: string
	) {
		const defaultMessages = {
			'node-content': '无法提取节点内容',
			'connected-nodes': '无法访问连接的节点',
			'context-build': '无法构建上下文字符串'
		};
		
		super(message || defaultMessages[stage], details);
		this.stage = stage;
		this.nodeId = nodeId;
	}
}
