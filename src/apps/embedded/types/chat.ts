/**
 * Chat Types
 * TypeScript types for chat functionality including messages, content types,
 * and JSON-RPC 2.0 protocol definitions
 */

/**
 * Base content type for all message parts
 * Discriminated union pattern: use `type` field to narrow type
 */
interface BaseChatContent {
  type: string;
  timestamp: string;
}

/**
 * Text content - the main conversational content
 */
export interface TextContent extends BaseChatContent {
  type: 'text';
  content: string;
}

/**
 * Tool invocation status - discriminated union for type-safe status handling
 * Ensures result/error fields are only present when appropriate
 */
export type ToolInvocationStatus =
  | { state: 'executing' }
  | { state: 'completed'; result?: unknown }
  | { state: 'failed'; error: string };

/**
 * Tool invocation - indicates the AI is calling a tool
 */
export interface ToolInvocationContent extends BaseChatContent {
  type: 'tool_invocation';
  toolUseId: string;    // Unique identifier from Anthropic API for this specific tool use
  toolName: string;
  toolInput: Record<string, unknown>;
  status: ToolInvocationStatus;
}

/**
 * Thinking content - intermediate reasoning (if extended thinking enabled)
 */
export interface ThinkingContent extends BaseChatContent {
  type: 'thinking';
  content: string;
}

/**
 * Usage information - token count and cost data
 */
export interface UsageContent extends BaseChatContent {
  type: 'usage';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
}

/**
 * Error content - represents an error in the message
 */
export interface ErrorContent extends BaseChatContent {
  type: 'error';
  code: string;
  message: string;
}

/**
 * Union type for all possible chat content types
 * Use discriminated union pattern: switch on `type` field
 */
export type ChatContent = TextContent | ToolInvocationContent | ThinkingContent | UsageContent | ErrorContent;

/**
 * Chat message - represents a single message in the conversation
 * Messages can contain multiple parts (multi-part architecture)
 */
export interface ChatMessage {
  id: string;                    // Unique message ID
  role: 'user' | 'assistant' | 'system';
  conversationId: string;        // Groups messages into conversations
  timestamp: string;             // ISO 8601 timestamp
  parts: ChatContent[];          // Multi-part message content
  isStreaming?: boolean;         // Whether message is still being streamed
}

/**
 * Chat conversation - groups related messages
 */
export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

/**
 * SDK status information
 */
export interface SDKStatus {
  sdkAvailable: boolean;
  sdkVersion: string | null;
  errorMessage: string | null;
}

/**
 * JSON-RPC 2.0 Request
 * https://www.jsonrpc.org/specification
 */
export interface JsonRpcRequest<T extends Record<string, unknown> = Record<string, unknown>> {
  jsonrpc: '2.0';
  method: string;
  params?: T;
  id: string | number;
}

/**
 * JSON-RPC 2.0 Notification (no response expected)
 */
export interface JsonRpcNotification<T extends Record<string, unknown> = Record<string, unknown>> {
  jsonrpc: '2.0';
  method: string;
  params?: T;
}

/**
 * JSON-RPC 2.0 Success Response
 */
export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  result: T;
  id: string | number;
}

/**
 * JSON-RPC 2.0 Error Response
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcErrorResponse {
  jsonrpc: '2.0';
  error: JsonRpcError;
  id: string | number;
}

/**
 * Union type for all JSON-RPC message types
 */
export type JsonRpcMessage<T extends Record<string, unknown> = Record<string, unknown>> =
  | JsonRpcRequest<T>
  | JsonRpcNotification<T>
  | JsonRpcResponse
  | JsonRpcErrorResponse;

/**
 * Chat API Error Codes (JSON-RPC)
 */
export enum ChatErrorCode {
  ParseError = -32700,           // Invalid JSON received
  InvalidRequest = -32600,       // Invalid JSON-RPC format
  MethodNotFound = -32601,       // Method does not exist
  InvalidParams = -32602,        // Invalid method parameters
  InternalError = -32603,        // Server internal error
  SdkUnavailable = -32001,       // Anthropic SDK not installed
  OperationCancelled = -32002,   // User cancelled the operation
}

/**
 * Chat status request/response types
 * Note: Wire format uses snake_case (sdk_available, sdk_version) while TypeScript uses camelCase
 * Service layer handles the conversion between formats
 */
export interface ChatStatusParams {
  [key: string]: unknown;
}

export interface ChatStatusResult {
  sdkAvailable: boolean;
  sdkVersion: string | null;
  errorMessage: string | null;
}

/**
 * Chat send request parameters
 */
export interface ChatSendParams {
  message: string;
  [key: string]: unknown;
}

/**
 * Chat send completion result
 */
export interface ChatSendResult {
  conversationId: string;
  status: 'complete' | 'cancelled';
  totalCostUsd: number;
  timestamp: string;
}

/**
 * Chat response chunk notification params
 * Sent as server notification during streaming
 */
export interface ChatResponseChunkParams {
  conversationId: string;
  content: string;
  isFinal: boolean;
  timestamp: string;
}

/**
 * Chat tool invocation notification params (wire format from server)
 * Converted to ToolInvocationStatus internally by chatService
 */
export interface ChatToolInvokeParams {
  conversationId: string;
  tool_use_id: string;      // Unique identifier from Anthropic API
  toolName: string;
  toolInput: Record<string, unknown>;
  status: 'executing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
  timestamp: string;
}

/**
 * Chat thinking notification params (if extended thinking enabled)
 */
export interface ChatThinkingParams {
  conversationId: string;
  content: string;
  timestamp: string;
}

/**
 * Chat usage notification params
 */
export interface ChatUsageParams {
  conversationId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  timestamp: string;
}

/**
 * Chat error notification params
 */
export interface ChatErrorParams {
  code: string;
  message: string;
  timestamp: string;
}

/**
 * Chat cancel request parameters
 * Note: Wire format uses snake_case while TypeScript uses camelCase
 * Service layer handles the conversion between formats
 */
export interface ChatCancelParams {
  [key: string]: unknown;
}

export interface ChatCancelResult {
  cancelled: boolean;
  conversationId: string;
}

/**
 * Type-safe chat request builders
 */
export const createChatStatusRequest = (id: string | number): JsonRpcRequest<ChatStatusParams> => ({
  jsonrpc: '2.0',
  method: 'chat.status',
  params: {},
  id,
});

export const createChatSendRequest = (message: string, id: string | number): JsonRpcRequest<ChatSendParams> => ({
  jsonrpc: '2.0',
  method: 'chat.send',
  params: { message },
  id,
});

export const createChatCancelRequest = (id: string | number): JsonRpcRequest<ChatCancelParams> => ({
  jsonrpc: '2.0',
  method: 'chat.cancel',
  params: {},
  id,
});
