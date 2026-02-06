/**
 * Chat Validation Utilities
 * Provides validation functions for chat store operations with detailed error messages
 */

import {
  ChatMessage,
  ChatContent,
  TextContent,
  ToolInvocationContent,
  SDKStatus,
} from '../types/chat';

/**
 * Validation error that includes context about what failed
 */
export class ChatValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ChatValidationError';
  }
}

/**
 * Validate message ID is non-empty string
 */
export function validateMessageId(id: unknown): asserts id is string {
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new ChatValidationError(
      'INVALID_MESSAGE_ID',
      'Message ID must be a non-empty string',
      { id }
    );
  }
}

/**
 * Validate message role
 */
export function validateRole(role: unknown): asserts role is 'user' | 'assistant' | 'system' {
  const validRoles = ['user', 'assistant', 'system'];
  if (!validRoles.includes(role as string)) {
    throw new ChatValidationError(
      'INVALID_ROLE',
      `Message role must be one of: ${validRoles.join(', ')}`,
      { role }
    );
  }
}

/**
 * Validate ISO 8601 timestamp format
 */
export function validateTimestamp(timestamp: unknown): asserts timestamp is string {
  if (typeof timestamp !== 'string' || timestamp.length === 0) {
    throw new ChatValidationError(
      'INVALID_TIMESTAMP',
      'Timestamp must be a non-empty string',
      { timestamp }
    );
  }

  // Basic ISO 8601 format check
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!isoRegex.test(timestamp)) {
    throw new ChatValidationError(
      'INVALID_TIMESTAMP_FORMAT',
      'Timestamp must be in ISO 8601 format (e.g., 2024-01-01T12:00:00.000Z)',
      { timestamp }
    );
  }

  // Validate that the date is actually valid (e.g., month 1-12, day 1-31)
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw new ChatValidationError(
        'INVALID_TIMESTAMP_VALUE',
        'Timestamp is not a valid date',
        { timestamp }
      );
    }
  } catch {
    throw new ChatValidationError(
      'INVALID_TIMESTAMP_VALUE',
      'Timestamp is not a valid date',
      { timestamp }
    );
  }
}

/**
 * Validate text content structure
 */
export function validateTextContent(content: unknown): asserts content is TextContent {
  if (!content || typeof content !== 'object') {
    throw new ChatValidationError(
      'INVALID_TEXT_CONTENT',
      'Text content must be an object',
      { content }
    );
  }

  const textContent = content as Record<string, unknown>;

  if (textContent.type !== 'text') {
    throw new ChatValidationError(
      'INVALID_CONTENT_TYPE',
      'Content type must be "text"',
      { type: textContent.type }
    );
  }

  if (typeof textContent.content !== 'string') {
    throw new ChatValidationError(
      'INVALID_TEXT',
      'Text content must be a string',
      { content: textContent.content }
    );
  }

  if (textContent.timestamp && typeof textContent.timestamp !== 'string') {
    throw new ChatValidationError(
      'INVALID_TIMESTAMP',
      'Content timestamp must be a string',
      { timestamp: textContent.timestamp }
    );
  }
}

/**
 * Validate tool invocation content structure
 */
export function validateToolInvocationContent(content: unknown): asserts content is ToolInvocationContent {
  if (!content || typeof content !== 'object') {
    throw new ChatValidationError(
      'INVALID_TOOL_INVOCATION',
      'Tool invocation must be an object',
      { content }
    );
  }

  const tool = content as Record<string, unknown>;

  if (tool.type !== 'tool_invocation') {
    throw new ChatValidationError(
      'INVALID_CONTENT_TYPE',
      'Content type must be "tool_invocation"',
      { type: tool.type }
    );
  }

  if (typeof tool.toolUseId !== 'string' || tool.toolUseId.length === 0) {
    throw new ChatValidationError(
      'INVALID_TOOL_USE_ID',
      'toolUseId must be a non-empty string',
      { toolUseId: tool.toolUseId }
    );
  }

  if (typeof tool.toolName !== 'string' || tool.toolName.length === 0) {
    throw new ChatValidationError(
      'INVALID_TOOL_NAME',
      'toolName must be a non-empty string',
      { toolName: tool.toolName }
    );
  }

  if (!tool.toolInput || typeof tool.toolInput !== 'object') {
    throw new ChatValidationError(
      'INVALID_TOOL_INPUT',
      'toolInput must be an object',
      { toolInput: tool.toolInput }
    );
  }

  if (!tool.status || typeof tool.status !== 'object') {
    throw new ChatValidationError(
      'INVALID_TOOL_STATUS',
      'status must be an object',
      { status: tool.status }
    );
  }

  const status = tool.status as Record<string, unknown>;
  const validStates = ['executing', 'completed', 'failed'];
  if (!validStates.includes(status.state as string)) {
    throw new ChatValidationError(
      'INVALID_TOOL_STATUS_STATE',
      `Tool status state must be one of: ${validStates.join(', ')}`,
      { state: status.state }
    );
  }

  if (tool.timestamp && typeof tool.timestamp !== 'string') {
    throw new ChatValidationError(
      'INVALID_TIMESTAMP',
      'Content timestamp must be a string',
      { timestamp: tool.timestamp }
    );
  }
}

/**
 * Validate any chat content type
 */
export function validateChatContent(content: unknown): asserts content is ChatContent {
  if (!content || typeof content !== 'object') {
    throw new ChatValidationError(
      'INVALID_CONTENT',
      'Content must be an object',
      { content }
    );
  }

  const chatContent = content as Record<string, unknown>;
  const type = chatContent.type;

  if (typeof type !== 'string') {
    throw new ChatValidationError(
      'INVALID_CONTENT_TYPE',
      'Content must have a type field that is a string',
      { type }
    );
  }

  // Validate timestamp exists (can be empty string, store will fill it in)
  if (typeof chatContent.timestamp !== 'string') {
    throw new ChatValidationError(
      'MISSING_TIMESTAMP',
      'Content must have a timestamp field',
      { timestamp: chatContent.timestamp }
    );
  }

  // Type-specific validation
  switch (type) {
    case 'text': {
      if (typeof chatContent.content !== 'string') {
        throw new ChatValidationError(
          'INVALID_TEXT_CONTENT',
          'Text content must have a content field that is a string',
          { content: chatContent.content }
        );
      }
      break;
    }

    case 'tool_invocation': {
      if (typeof chatContent.toolUseId !== 'string' || chatContent.toolUseId.length === 0) {
        throw new ChatValidationError(
          'INVALID_TOOL_USE_ID',
          'Tool invocation must have a non-empty toolUseId',
          { toolUseId: chatContent.toolUseId }
        );
      }
      if (typeof chatContent.toolName !== 'string') {
        throw new ChatValidationError(
          'INVALID_TOOL_NAME',
          'Tool invocation must have a toolName field',
          { toolName: chatContent.toolName }
        );
      }
      if (!chatContent.toolInput || typeof chatContent.toolInput !== 'object') {
        throw new ChatValidationError(
          'INVALID_TOOL_INPUT',
          'Tool invocation must have a toolInput field',
          { toolInput: chatContent.toolInput }
        );
      }
      if (!chatContent.status || typeof chatContent.status !== 'object') {
        throw new ChatValidationError(
          'INVALID_TOOL_STATUS',
          'Tool invocation must have a status field',
          { status: chatContent.status }
        );
      }
      break;
    }

    case 'thinking': {
      if (typeof chatContent.content !== 'string') {
        throw new ChatValidationError(
          'INVALID_THINKING_CONTENT',
          'Thinking content must have a content field that is a string',
          { content: chatContent.content }
        );
      }
      break;
    }

    case 'usage': {
      if (typeof chatContent.inputTokens !== 'number') {
        throw new ChatValidationError(
          'INVALID_USAGE',
          'Usage content must have an inputTokens field that is a number',
          { inputTokens: chatContent.inputTokens }
        );
      }
      if (typeof chatContent.outputTokens !== 'number') {
        throw new ChatValidationError(
          'INVALID_USAGE',
          'Usage content must have an outputTokens field that is a number',
          { outputTokens: chatContent.outputTokens }
        );
      }
      if (typeof chatContent.totalTokens !== 'number') {
        throw new ChatValidationError(
          'INVALID_USAGE',
          'Usage content must have a totalTokens field that is a number',
          { totalTokens: chatContent.totalTokens }
        );
      }
      if (typeof chatContent.totalCostUsd !== 'number') {
        throw new ChatValidationError(
          'INVALID_USAGE',
          'Usage content must have a totalCostUsd field that is a number',
          { totalCostUsd: chatContent.totalCostUsd }
        );
      }
      break;
    }

    case 'error': {
      if (typeof chatContent.code !== 'string') {
        throw new ChatValidationError(
          'INVALID_ERROR',
          'Error content must have a code field that is a string',
          { code: chatContent.code }
        );
      }
      if (typeof chatContent.message !== 'string') {
        throw new ChatValidationError(
          'INVALID_ERROR',
          'Error content must have a message field that is a string',
          { message: chatContent.message }
        );
      }
      break;
    }

    default: {
      throw new ChatValidationError(
        'UNKNOWN_CONTENT_TYPE',
        `Unknown content type: ${type}. Must be one of: text, tool_invocation, thinking, usage, error`,
        { type }
      );
    }
  }
}

/**
 * Validate complete chat message structure
 */
export function validateChatMessage(message: unknown): asserts message is ChatMessage {
  if (!message || typeof message !== 'object') {
    throw new ChatValidationError(
      'INVALID_MESSAGE',
      'Message must be an object',
      { message }
    );
  }

  const chatMessage = message as Record<string, unknown>;

  // Validate required fields
  if (typeof chatMessage.id !== 'string' || chatMessage.id.length === 0) {
    throw new ChatValidationError(
      'INVALID_MESSAGE_ID',
      'Message must have a non-empty id field',
      { id: chatMessage.id }
    );
  }

  if (typeof chatMessage.role !== 'string') {
    throw new ChatValidationError(
      'INVALID_ROLE',
      'Message must have a role field that is a string',
      { role: chatMessage.role }
    );
  }

  const validRoles = ['user', 'assistant', 'system'];
  if (!validRoles.includes(chatMessage.role)) {
    throw new ChatValidationError(
      'INVALID_ROLE_VALUE',
      `Role must be one of: ${validRoles.join(', ')}`,
      { role: chatMessage.role }
    );
  }

  if (typeof chatMessage.conversationId !== 'string' || chatMessage.conversationId.length === 0) {
    throw new ChatValidationError(
      'INVALID_CONVERSATION_ID',
      'Message must have a non-empty conversationId field',
      { conversationId: chatMessage.conversationId }
    );
  }

  if (typeof chatMessage.timestamp !== 'string' || chatMessage.timestamp.length === 0) {
    throw new ChatValidationError(
      'INVALID_TIMESTAMP',
      'Message must have a non-empty timestamp field',
      { timestamp: chatMessage.timestamp }
    );
  }

  if (!Array.isArray(chatMessage.parts)) {
    throw new ChatValidationError(
      'INVALID_PARTS',
      'Message must have a parts field that is an array',
      { parts: chatMessage.parts }
    );
  }

  // Validate each part
  for (let i = 0; i < chatMessage.parts.length; i++) {
    try {
      validateChatContent(chatMessage.parts[i]);
    } catch (error) {
      if (error instanceof ChatValidationError) {
        throw new ChatValidationError(
          error.code,
          `Invalid content at parts[${i}]: ${error.message}`,
          { ...error.context, partIndex: i }
        );
      }
      throw error;
    }
  }

  // Validate optional fields
  if (chatMessage.isStreaming !== undefined && typeof chatMessage.isStreaming !== 'boolean') {
    throw new ChatValidationError(
      'INVALID_STREAMING_FLAG',
      'isStreaming must be a boolean',
      { isStreaming: chatMessage.isStreaming }
    );
  }
}

/**
 * Validate SDK status structure
 */
export function validateSDKStatus(status: unknown): asserts status is SDKStatus {
  if (!status || typeof status !== 'object') {
    throw new ChatValidationError(
      'INVALID_SDK_STATUS',
      'SDK status must be an object',
      { status }
    );
  }

  const sdkStatus = status as Record<string, unknown>;

  if (typeof sdkStatus.sdkAvailable !== 'boolean') {
    throw new ChatValidationError(
      'INVALID_SDK_AVAILABLE',
      'sdkAvailable must be a boolean',
      { sdkAvailable: sdkStatus.sdkAvailable }
    );
  }

  if (sdkStatus.sdkVersion !== null && typeof sdkStatus.sdkVersion !== 'string') {
    throw new ChatValidationError(
      'INVALID_SDK_VERSION',
      'sdkVersion must be a string or null',
      { sdkVersion: sdkStatus.sdkVersion }
    );
  }

  if (sdkStatus.errorMessage !== null && typeof sdkStatus.errorMessage !== 'string') {
    throw new ChatValidationError(
      'INVALID_ERROR_MESSAGE',
      'errorMessage must be a string or null',
      { errorMessage: sdkStatus.errorMessage }
    );
  }
}

/**
 * Validate conversation ID is non-empty string or null
 */
export function validateConversationId(id: unknown): asserts id is string | null {
  if (id !== null && (typeof id !== 'string' || id.length === 0)) {
    throw new ChatValidationError(
      'INVALID_CONVERSATION_ID',
      'Conversation ID must be a non-empty string or null',
      { id }
    );
  }
}

/**
 * Validate error message is string or null
 */
export function validateErrorMessage(error: unknown): asserts error is string | null {
  if (error !== null && typeof error !== 'string') {
    throw new ChatValidationError(
      'INVALID_ERROR_MESSAGE',
      'Error message must be a string or null',
      { error }
    );
  }
}

/**
 * Validate message updates (partial) are compatible with ChatMessage structure
 */
export function validateMessageUpdates(updates: unknown): asserts updates is Partial<ChatMessage> {
  if (!updates || typeof updates !== 'object') {
    throw new ChatValidationError(
      'INVALID_UPDATES',
      'Updates must be an object',
      { updates }
    );
  }

  const messageUpdates = updates as Record<string, unknown>;

  // Check each field that's being updated
  if (messageUpdates.id !== undefined && (typeof messageUpdates.id !== 'string' || messageUpdates.id.length === 0)) {
    throw new ChatValidationError(
      'INVALID_ID_UPDATE',
      'Updated id must be a non-empty string',
      { id: messageUpdates.id }
    );
  }

  if (messageUpdates.role !== undefined) {
    const validRoles = ['user', 'assistant', 'system'];
    if (!validRoles.includes(messageUpdates.role as string)) {
      throw new ChatValidationError(
        'INVALID_ROLE_UPDATE',
        `Updated role must be one of: ${validRoles.join(', ')}`,
        { role: messageUpdates.role }
      );
    }
  }

  if (messageUpdates.conversationId !== undefined && (typeof messageUpdates.conversationId !== 'string' || messageUpdates.conversationId.length === 0)) {
    throw new ChatValidationError(
      'INVALID_CONVERSATION_ID_UPDATE',
      'Updated conversationId must be a non-empty string',
      { conversationId: messageUpdates.conversationId }
    );
  }

  if (messageUpdates.timestamp !== undefined && typeof messageUpdates.timestamp !== 'string') {
    throw new ChatValidationError(
      'INVALID_TIMESTAMP_UPDATE',
      'Updated timestamp must be a string',
      { timestamp: messageUpdates.timestamp }
    );
  }

  if (messageUpdates.isStreaming !== undefined && typeof messageUpdates.isStreaming !== 'boolean') {
    throw new ChatValidationError(
      'INVALID_STREAMING_UPDATE',
      'Updated isStreaming must be a boolean',
      { isStreaming: messageUpdates.isStreaming }
    );
  }

  // parts array should not be directly updated - use appendPart instead
  if (messageUpdates.parts !== undefined) {
    throw new ChatValidationError(
      'INVALID_PARTS_UPDATE',
      'Parts cannot be directly updated - use appendPart or appendTextContent instead',
      { parts: messageUpdates.parts }
    );
  }
}

/**
 * Validate tool invocation updates are compatible with ToolInvocationContent
 */
export function validateToolInvocationUpdates(updates: unknown): asserts updates is Partial<ToolInvocationContent> {
  if (!updates || typeof updates !== 'object') {
    throw new ChatValidationError(
      'INVALID_UPDATES',
      'Updates must be an object',
      { updates }
    );
  }

  const toolUpdates = updates as Record<string, unknown>;

  // Validate optional fields if provided
  if (toolUpdates.toolName !== undefined && (typeof toolUpdates.toolName !== 'string' || toolUpdates.toolName.length === 0)) {
    throw new ChatValidationError(
      'INVALID_TOOL_NAME',
      'Updated toolName must be a non-empty string',
      { toolName: toolUpdates.toolName }
    );
  }

  if (toolUpdates.toolInput !== undefined && (typeof toolUpdates.toolInput !== 'object' || toolUpdates.toolInput === null)) {
    throw new ChatValidationError(
      'INVALID_TOOL_INPUT',
      'Updated toolInput must be an object',
      { toolInput: toolUpdates.toolInput }
    );
  }

  if (toolUpdates.status !== undefined) {
    if (typeof toolUpdates.status !== 'object' || toolUpdates.status === null) {
      throw new ChatValidationError(
        'INVALID_TOOL_STATUS',
        'Updated status must be an object',
        { status: toolUpdates.status }
      );
    }

    const status = toolUpdates.status as Record<string, unknown>;
    const validStates = ['executing', 'completed', 'failed'];
    if (!validStates.includes(status.state as string)) {
      throw new ChatValidationError(
        'INVALID_STATUS_STATE',
        `Updated status state must be one of: ${validStates.join(', ')}`,
        { state: status.state }
      );
    }
  }
}
