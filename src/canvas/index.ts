/**
 * Canvas AI 集成模块
 * 
 * 提供 Canvas 画布中的 AI 辅助功能
 * 
 * 验证需求：10.1-10.8
 */

export { CanvasMenuHandler } from './canvas-menu-handler';
export { CanvasInputModal } from './canvas-input-modal';
export { CanvasUIController } from './canvas-ui-controller';
export { CanvasContextExtractor } from './canvas-context-extractor';
export { CanvasNodeManager } from './canvas-node-manager';
export { 
	CanvasNotAvailableError, 
	NodeOperationError, 
	ContextExtractionError 
} from './canvas-errors';
