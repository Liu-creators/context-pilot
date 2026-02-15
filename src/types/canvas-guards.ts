/**
 * Canvas 类型守卫函数
 * 
 * 提供运行时类型检查函数，用于安全地识别不同类型的 Canvas 节点和视图。
 * 
 * 验证需求：10.1, 10.2
 */

import { View } from 'obsidian';
import type {
	Canvas,
	CanvasNode,
	CanvasTextNode,
	CanvasFileNode,
	CanvasLinkNode,
	CanvasGroupNode
} from './canvas';

/**
 * 类型守卫：检查节点是否为文本节点
 * 
 * @param node Canvas 节点
 * @returns 是否为文本节点
 * 
 * @example
 * ```ts
 * if (isTextNode(node)) {
 *   console.log(node.text); // TypeScript 知道这是 CanvasTextNode
 * }
 * ```
 */
export function isTextNode(node: CanvasNode): node is CanvasTextNode {
	return node.type === 'text' || (!node.type && typeof (node as any).text === 'string');
}

/**
 * 类型守卫：检查节点是否为文件节点
 * 
 * @param node Canvas 节点
 * @returns 是否为文件节点
 * 
 * @example
 * ```ts
 * if (isFileNode(node)) {
 *   console.log(node.file); // TypeScript 知道这是 CanvasFileNode
 * }
 * ```
 */
export function isFileNode(node: CanvasNode): node is CanvasFileNode {
	if (node.type === 'file') return true;
	if (node.type) return false;
	
	const nodeAny = node as any;
	// check if file property exists and is string or TFile (object with path)
	if (typeof nodeAny.file === 'string') return true;
	if (nodeAny.file && typeof nodeAny.file === 'object' && typeof nodeAny.file.path === 'string') return true;
	
	return false;
}

/**
 * 类型守卫：检查节点是否为链接节点
 * 
 * @param node Canvas 节点
 * @returns 是否为链接节点
 * 
 * @example
 * ```ts
 * if (isLinkNode(node)) {
 *   console.log(node.url); // TypeScript 知道这是 CanvasLinkNode
 * }
 * ```
 */
export function isLinkNode(node: CanvasNode): node is CanvasLinkNode {
	return node.type === 'link' || (!node.type && typeof (node as any).url === 'string');
}

/**
 * 类型守卫：检查节点是否为分组节点
 * 
 * @param node Canvas 节点
 * @returns 是否为分组节点
 * 
 * @example
 * ```ts
 * if (isGroupNode(node)) {
 *   console.log(node.label); // TypeScript 知道这是 CanvasGroupNode
 * }
 * ```
 */
export function isGroupNode(node: CanvasNode): node is CanvasGroupNode {
	if (node.type === 'group') return true;
	if (node.type) return false;
	
	// 如果没有 type 属性，且不包含 text/file/url 属性，则认为是分组节点
	const nodeAny = node as any;
	return typeof nodeAny.text === 'undefined' && 
		   typeof nodeAny.file === 'undefined' && 
		   typeof nodeAny.url === 'undefined';
}

/**
 * 类型守卫：检查视图是否为 Canvas 视图
 * 
 * @param view Obsidian 视图
 * @returns 是否为 Canvas 视图
 * 
 * 验证需求：10.1
 * 
 * @example
 * ```ts
 * const activeView = this.app.workspace.getActiveViewOfType(View);
 * if (activeView && isCanvasView(activeView)) {
 *   // TypeScript 知道 activeView 是 Canvas
 *   const nodes = activeView.nodes;
 * }
 * ```
 */
export function isCanvasView(view: View): view is Canvas {
	return view.getViewType() === 'canvas';
}
