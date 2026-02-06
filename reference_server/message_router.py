"""
Message Router for JSON-RPC 2.0
Routes incoming WebSocket messages to appropriate handlers
Handles JSON-RPC method dispatch, error handling, and streaming responses
"""

import json
import logging
from typing import Dict, Any, Callable, Optional, Coroutine, AsyncGenerator
from enum import Enum

logger = logging.getLogger(__name__)


class JsonRpcErrorCode(Enum):
    """JSON-RPC 2.0 Error Codes"""
    PARSE_ERROR = -32700
    INVALID_REQUEST = -32600
    METHOD_NOT_FOUND = -32601
    INVALID_PARAMS = -32602
    INTERNAL_ERROR = -32603
    SDK_UNAVAILABLE = -32001
    OPERATION_CANCELLED = -32002


def create_json_rpc_response(result: Any, request_id: Any) -> Dict[str, Any]:
    """Create a successful JSON-RPC response"""
    return {
        'jsonrpc': '2.0',
        'result': result,
        'id': request_id
    }


def create_json_rpc_error(
    code: int,
    message: str,
    request_id: Any,
    data: Optional[Any] = None
) -> Dict[str, Any]:
    """Create a JSON-RPC error response"""
    error = {
        'code': code,
        'message': message
    }
    if data is not None:
        error['data'] = data

    return {
        'jsonrpc': '2.0',
        'error': error,
        'id': request_id
    }


def create_json_rpc_notification(method: str, params: Optional[Any] = None) -> Dict[str, Any]:
    """Create a JSON-RPC notification (server→client)"""
    notification = {
        'jsonrpc': '2.0',
        'method': method
    }
    if params is not None:
        notification['params'] = params

    return notification


class MessageRouter:
    """
    Routes JSON-RPC 2.0 messages to appropriate handlers
    Manages method dispatch, error handling, and streaming
    """

    def __init__(self):
        # Maps method names to handler functions
        self.handlers: Dict[str, Callable] = {}
        # Maps method names to streaming handler functions
        self.streaming_handlers: Dict[str, Callable] = {}

    def register_handler(
        self,
        method: str,
        handler: Callable[[Dict[str, Any]], Coroutine]
    ) -> None:
        """
        Register a handler for a JSON-RPC method

        Args:
            method: The method name (e.g., 'chat.status')
            handler: Async function that takes params and returns result
        """
        self.handlers[method] = handler
        logger.info(f"Registered RPC handler for method: {method}")

    def register_streaming_handler(
        self,
        method: str,
        handler: Callable[[Dict[str, Any], Callable], AsyncGenerator]
    ) -> None:
        """
        Register a streaming handler for a JSON-RPC method

        Args:
            method: The method name (e.g., 'chat.send')
            handler: Async generator function that yields notifications and final result
        """
        self.streaming_handlers[method] = handler
        logger.info(f"Registered streaming RPC handler for method: {method}")

    async def route_message(
        self,
        message: str,
        send_response: Callable[[str], Coroutine],
        send_notification: Callable[[str], Coroutine]
    ) -> None:
        """
        Route an incoming JSON-RPC message

        Args:
            message: Raw JSON message string
            send_response: Async function to send response back to client
            send_notification: Async function to send notifications to client
        """
        try:
            # Parse message
            try:
                data = json.loads(message)
            except json.JSONDecodeError as e:
                error_response = create_json_rpc_error(
                    JsonRpcErrorCode.PARSE_ERROR.value,
                    f"Invalid JSON: {str(e)}",
                    None,
                    {'detail': str(e)}
                )
                await send_response(json.dumps(error_response))
                return

            # Validate JSON-RPC format
            if not isinstance(data, dict):
                error_response = create_json_rpc_error(
                    JsonRpcErrorCode.INVALID_REQUEST.value,
                    "Request must be an object",
                    None
                )
                await send_response(json.dumps(error_response))
                return

            # Check required fields
            if data.get('jsonrpc') != '2.0':
                error_response = create_json_rpc_error(
                    JsonRpcErrorCode.INVALID_REQUEST.value,
                    "jsonrpc must be '2.0'",
                    data.get('id')
                )
                await send_response(json.dumps(error_response))
                return

            method = data.get('method')
            if not method:
                error_response = create_json_rpc_error(
                    JsonRpcErrorCode.INVALID_REQUEST.value,
                    "method is required",
                    data.get('id')
                )
                await send_response(json.dumps(error_response))
                return

            request_id = data.get('id')
            params = data.get('params', {})

            # Check if it's a notification (no id)
            is_notification = request_id is None

            logger.info(f"Routing RPC method: {method} (id: {request_id})")

            # Route to streaming handler if registered
            if method in self.streaming_handlers:
                await self._handle_streaming(
                    method,
                    params,
                    request_id,
                    send_response,
                    send_notification
                )
                return

            # Route to regular handler
            if method in self.handlers:
                await self._handle_regular(
                    method,
                    params,
                    request_id,
                    is_notification,
                    send_response
                )
                return

            # Method not found
            error_response = create_json_rpc_error(
                JsonRpcErrorCode.METHOD_NOT_FOUND.value,
                f"Method '{method}' not found",
                request_id
            )
            await send_response(json.dumps(error_response))

        except Exception as e:
            logger.error(f"Error routing message: {str(e)}", exc_info=True)
            error_response = create_json_rpc_error(
                JsonRpcErrorCode.INTERNAL_ERROR.value,
                f"Internal server error: {str(e)}",
                data.get('id') if 'data' in locals() else None
            )
            try:
                await send_response(json.dumps(error_response))
            except Exception as send_error:
                logger.error(f"Failed to send error response: {str(send_error)}")

    async def _handle_regular(
        self,
        method: str,
        params: Dict[str, Any],
        request_id: Any,
        is_notification: bool,
        send_response: Callable[[str], Coroutine]
    ) -> None:
        """Handle a regular (non-streaming) RPC method"""
        try:
            handler = self.handlers[method]

            # Call handler
            result = await handler(params)

            # Don't send response for notifications
            if is_notification:
                logger.info(f"Notification '{method}' processed")
                return

            # Send success response
            response = create_json_rpc_response(
                self._serialize_dataclass(result),
                request_id
            )
            await send_response(json.dumps(response))

        except TypeError as e:
            # Invalid parameters
            error_response = create_json_rpc_error(
                JsonRpcErrorCode.INVALID_PARAMS.value,
                f"Invalid parameters: {str(e)}",
                request_id
            )
            await send_response(json.dumps(error_response))

        except ValueError as e:
            # Validation error
            error_response = create_json_rpc_error(
                JsonRpcErrorCode.INVALID_PARAMS.value,
                str(e),
                request_id
            )
            await send_response(json.dumps(error_response))

        except RuntimeError as e:
            # Runtime error (e.g., SDK not available)
            error_response = create_json_rpc_error(
                JsonRpcErrorCode.SDK_UNAVAILABLE.value,
                str(e),
                request_id
            )
            await send_response(json.dumps(error_response))

        except Exception as e:
            logger.error(f"Error in handler '{method}': {str(e)}", exc_info=True)
            error_response = create_json_rpc_error(
                JsonRpcErrorCode.INTERNAL_ERROR.value,
                f"Internal error: {str(e)}",
                request_id
            )
            await send_response(json.dumps(error_response))

    async def _handle_streaming(
        self,
        method: str,
        params: Dict[str, Any],
        request_id: Any,
        send_response: Callable[[str], Coroutine],
        send_notification: Callable[[str], Coroutine]
    ) -> None:
        """Handle a streaming RPC method"""
        try:
            handler = self.streaming_handlers[method]

            # Create notification sender for this handler
            async def send_handler_notification(notification_method: str, notification_params: Any) -> None:
                notification = create_json_rpc_notification(notification_method, notification_params)
                await send_notification(json.dumps(notification))

            # Call streaming handler
            async for chunk in handler(params, send_handler_notification):
                # Chunk can be a response (with result/error) or notification
                if 'result' in chunk or 'error' in chunk:
                    # This is a final response
                    response = chunk
                    if request_id is not None:
                        response['id'] = request_id
                    await send_response(json.dumps(response))
                else:
                    # This is a notification
                    await send_notification(json.dumps(chunk))

        except TypeError as e:
            # Invalid parameters
            error_response = create_json_rpc_error(
                JsonRpcErrorCode.INVALID_PARAMS.value,
                f"Invalid parameters: {str(e)}",
                request_id
            )
            await send_response(json.dumps(error_response))

        except ValueError as e:
            # Validation error
            error_response = create_json_rpc_error(
                JsonRpcErrorCode.INVALID_PARAMS.value,
                str(e),
                request_id
            )
            await send_response(json.dumps(error_response))

        except RuntimeError as e:
            # Runtime error (e.g., SDK not available)
            error_response = create_json_rpc_error(
                JsonRpcErrorCode.SDK_UNAVAILABLE.value,
                str(e),
                request_id
            )
            await send_response(json.dumps(error_response))

        except Exception as e:
            logger.error(f"Error in streaming handler '{method}': {str(e)}", exc_info=True)
            error_response = create_json_rpc_error(
                JsonRpcErrorCode.INTERNAL_ERROR.value,
                f"Internal error: {str(e)}",
                request_id
            )
            await send_response(json.dumps(error_response))

    def _serialize_dataclass(self, obj: Any) -> Any:
        """Convert dataclass instances to dictionaries"""
        if hasattr(obj, '__dataclass_fields__'):
            # It's a dataclass, convert to dict
            from dataclasses import asdict
            result = asdict(obj)
            # Convert snake_case keys to match API spec (e.g., sdk_available, total_cost_usd)
            return result
        elif isinstance(obj, dict):
            return obj
        elif isinstance(obj, list):
            return [self._serialize_dataclass(item) for item in obj]
        else:
            return obj


# Global message router instance
message_router = MessageRouter()
