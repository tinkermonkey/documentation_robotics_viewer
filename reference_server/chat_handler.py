"""
Chat Handler for JSON-RPC 2.0
Implements chat.status, chat.send, and chat.cancel methods
Handles integration with Anthropic SDK (when available)
"""

import asyncio
import json
import uuid
from typing import Dict, Optional, AsyncGenerator, List, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class ChatStatusResult:
    """Result of chat.status RPC method"""
    sdk_available: bool
    sdk_version: Optional[str] = None
    error_message: Optional[str] = None


@dataclass
class ChatSendParams:
    """Parameters for chat.send RPC method"""
    message: str


@dataclass
class ChatSendResult:
    """Result of chat.send RPC method (sent after streaming completes)"""
    conversation_id: str
    status: str  # 'complete' or 'cancelled'
    total_cost_usd: float = 0.0
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow().isoformat() + 'Z'


@dataclass
class ChatCancelParams:
    """Parameters for chat.cancel RPC method"""
    pass


@dataclass
class ChatCancelResult:
    """Result of chat.cancel RPC method"""
    cancelled: bool
    conversation_id: Optional[str] = None


class ChatSession:
    """Manages a single chat conversation session"""

    def __init__(self, conversation_id: str):
        self.conversation_id = conversation_id
        self.messages: List[Dict[str, Any]] = []
        self.is_active = False
        self.created_at = datetime.utcnow()


class ChatHandler:
    """
    Handler for chat operations
    Implements JSON-RPC methods for chat functionality
    """

    def __init__(self):
        self.sessions: Dict[str, ChatSession] = {}
        self.current_conversation_id: Optional[str] = None
        self.sdk_available = False
        self.sdk_version: Optional[str] = None
        self.anthropic_client = None
        self._check_sdk_availability()

    def _check_sdk_availability(self) -> None:
        """Check if Anthropic SDK is available"""
        try:
            import anthropic
            self.sdk_available = True
            self.sdk_version = anthropic.__version__
            self.anthropic_client = anthropic.AsyncAnthropic()
            logger.info(f"Anthropic SDK available (version {self.sdk_version})")
        except ImportError:
            self.sdk_available = False
            self.sdk_version = None
            logger.warning("Anthropic SDK not installed - chat features will be limited")

    async def handle_status(self, params: Dict[str, Any]) -> ChatStatusResult:
        """
        Handle chat.status RPC method
        Returns SDK availability and version information
        """
        if self.sdk_available:
            return ChatStatusResult(
                sdk_available=True,
                sdk_version=self.sdk_version,
                error_message=None
            )
        else:
            return ChatStatusResult(
                sdk_available=False,
                sdk_version=None,
                error_message="Anthropic SDK not installed. Install with: pip install anthropic"
            )

    async def handle_send(
        self,
        params: Dict[str, Any],
        send_notification: callable
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Handle chat.send RPC method
        Streams response chunks back to client via notifications
        Yields final result at the end
        """
        message = params.get('message', '').strip()

        # Validate message
        if not message:
            raise ValueError("Message cannot be empty")

        # Check SDK availability
        if not self.sdk_available:
            raise RuntimeError("Anthropic SDK not available. Install with: pip install anthropic")

        # Create or get conversation
        conversation_id = self.current_conversation_id or str(uuid.uuid4())
        self.current_conversation_id = conversation_id

        if conversation_id not in self.sessions:
            session = ChatSession(conversation_id)
            self.sessions[conversation_id] = session
        else:
            session = self.sessions[conversation_id]

        session.is_active = True

        try:
            # Add user message to history
            session.messages.append({
                "role": "user",
                "content": message
            })

            # Call Claude API with streaming
            total_cost_usd = 0.0
            input_tokens = 0
            output_tokens = 0

            try:
                response = await self.anthropic_client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=2048,
                    messages=session.messages,
                    stream=True,
                )

                # Collect full response for history
                full_response_text = ""
                tool_uses = []

                async for event in response:
                    # Handle content block start
                    if hasattr(event, 'type') and event.type == 'content_block_start':
                        if hasattr(event.content_block, 'type') and event.content_block.type == 'text':
                            # Text block starting
                            pass

                    # Handle content block delta (streaming text)
                    elif hasattr(event, 'type') and event.type == 'content_block_delta':
                        if hasattr(event.delta, 'type') and event.delta.type == 'text_delta':
                            chunk = event.delta.text
                            full_response_text += chunk

                            # Send text chunk notification
                            await send_notification(
                                'chat.response.chunk',
                                {
                                    'conversation_id': conversation_id,
                                    'content': chunk,
                                    'is_final': False,
                                    'timestamp': datetime.utcnow().isoformat() + 'Z'
                                }
                            )

                    # Handle message delta (for usage info)
                    elif hasattr(event, 'type') and event.type == 'message_delta':
                        if hasattr(event, 'usage'):
                            input_tokens = event.usage.input_tokens
                            output_tokens = event.usage.output_tokens

                    # Handle message start (for initial token counts)
                    elif hasattr(event, 'type') and event.type == 'message_start':
                        if hasattr(event.message, 'usage'):
                            input_tokens = event.message.usage.input_tokens
                            output_tokens = event.message.usage.output_tokens

                # Add assistant response to history
                session.messages.append({
                    "role": "assistant",
                    "content": full_response_text
                })

                # Calculate tokens
                total_tokens = input_tokens + output_tokens

                # Estimate cost (rough approximation for Sonnet)
                # Input: $3 per 1M tokens, Output: $15 per 1M tokens
                total_cost_usd = (input_tokens / 1000000 * 3) + (output_tokens / 1000000 * 15)

                # Send usage notification
                await send_notification(
                    'chat.usage',
                    {
                        'conversation_id': conversation_id,
                        'input_tokens': input_tokens,
                        'output_tokens': output_tokens,
                        'total_tokens': total_tokens,
                        'total_cost_usd': round(total_cost_usd, 6),
                        'timestamp': datetime.utcnow().isoformat() + 'Z'
                    }
                )

                # Yield final result
                yield {
                    'result': {
                        'conversation_id': conversation_id,
                        'status': 'complete',
                        'total_cost_usd': round(total_cost_usd, 6),
                        'timestamp': datetime.utcnow().isoformat() + 'Z'
                    }
                }

            except asyncio.CancelledError:
                # Handle cancellation
                logger.info(f"Chat request cancelled for conversation {conversation_id}")
                yield {
                    'result': {
                        'conversation_id': conversation_id,
                        'status': 'cancelled',
                        'total_cost_usd': 0.0,
                        'timestamp': datetime.utcnow().isoformat() + 'Z'
                    }
                }
            except Exception as e:
                logger.error(f"Error in chat.send: {str(e)}")
                # Send error notification
                await send_notification(
                    'chat.error',
                    {
                        'code': 'CHAT_ERROR',
                        'message': str(e),
                        'timestamp': datetime.utcnow().isoformat() + 'Z'
                    }
                )
                raise

        finally:
            session.is_active = False

    async def handle_cancel(self, params: Dict[str, Any]) -> ChatCancelResult:
        """
        Handle chat.cancel RPC method
        Cancels the current chat operation
        """
        if not self.current_conversation_id:
            return ChatCancelResult(
                cancelled=False,
                conversation_id=None
            )

        conversation_id = self.current_conversation_id
        if conversation_id in self.sessions:
            session = self.sessions[conversation_id]
            session.is_active = False

        return ChatCancelResult(
            cancelled=True,
            conversation_id=conversation_id
        )

    def get_session(self, conversation_id: str) -> Optional[ChatSession]:
        """Get a chat session by ID"""
        return self.sessions.get(conversation_id)

    def cleanup_old_sessions(self, max_age_hours: int = 24) -> None:
        """Clean up sessions older than max_age_hours"""
        cutoff = datetime.utcnow().timestamp() - (max_age_hours * 3600)

        to_delete = [
            cid for cid, session in self.sessions.items()
            if session.created_at.timestamp() < cutoff and not session.is_active
        ]

        for cid in to_delete:
            del self.sessions[cid]

        if to_delete:
            logger.info(f"Cleaned up {len(to_delete)} old chat sessions")


# Global chat handler instance
chat_handler = ChatHandler()
