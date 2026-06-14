// @vitest-environment happy-dom
/**
 * ChatPanel.spec.tsx — the chat thread + suggestions + composer composition.
 *
 * Renders the REAL ChatPanel (Heimdall ChatContainer/ChatMessage/ChatComposer/
 * ChatSuggestions + our chatAdapter) with messages seeded into the REAL
 * chatStore. We assert the adapter render (user bubble + bot markdown +
 * tool/thinking blocks), the suggestions gate (only when ≤1 message), the
 * composer scope label (from the uiStore selection), and that submitting calls
 * `chatService.sendMessage` with the typed text (spied, not invoked for real).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatPanel } from '@/apps/embedded/ui/ChatPanel';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { useChatStore } from '@/apps/embedded/stores/chatStore';
import { chatService } from '@/apps/embedded/services/chatService';
import type { ChatMessage } from '@/apps/embedded/types/chat';
import { renderWithProviders } from '../helpers/renderWithProviders';

const TS = '2026-06-14T10:00:00.000Z';

function userMsg(id: string, text: string): ChatMessage {
  return {
    id,
    role: 'user',
    conversationId: 'c1',
    timestamp: TS,
    parts: [{ type: 'text', content: text, timestamp: TS }],
  };
}

function botMsg(id: string, parts: ChatMessage['parts']): ChatMessage {
  return { id, role: 'assistant', conversationId: 'c1', timestamp: TS, parts };
}

/** Seed the chat thread, then render. */
function seedMessages(messages: ChatMessage[]) {
  useChatStore.setState({ messages });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ChatPanel — message rendering via the adapter', () => {
  it('renders a user bubble and a bot markdown body', async () => {
    renderWithProviders(<ChatPanel />);
    seedMessages([
      userMsg('u1', 'What does this element do?'),
      botMsg('b1', [{ type: 'text', content: 'It **loads** the model.', timestamp: TS }]),
    ]);

    // User row.
    const userRow = await screen.findByTestId('chat-message-user');
    expect(userRow).toHaveTextContent('What does this element do?');
    expect(within(userRow).getByText('You')).toBeInTheDocument();

    // Bot row: markdown body (bold) rendered, sender = DrBot.
    const botRow = await screen.findByTestId('chat-message-bot');
    expect(within(botRow).getByText('DrBot')).toBeInTheDocument();
    expect(botRow).toHaveTextContent('loads');
  });

  it('renders tool and thinking blocks from interleaved bot parts', async () => {
    renderWithProviders(<ChatPanel />);
    seedMessages([
      userMsg('u1', 'trace it'),
      botMsg('b1', [
        { type: 'thinking', content: 'considering options', timestamp: TS },
        {
          type: 'tool_invocation',
          toolUseId: 't1',
          toolName: 'search_model',
          toolInput: { query: 'data loader' },
          status: { state: 'completed', result: 'ok' },
          timestamp: TS,
        },
        { type: 'text', content: 'Done.', timestamp: TS },
      ]),
    ]);

    // Thinking + tool blocks render (collapsed, but present with their testids).
    expect(await screen.findByTestId('thinking-block')).toBeInTheDocument();
    const tool = await screen.findByTestId('tool-block');
    expect(within(tool).getByText('search_model')).toBeInTheDocument();
  });
});

describe('ChatPanel — suggestions gating', () => {
  it('shows suggestions when the thread is empty (≤ 1 message)', async () => {
    renderWithProviders(<ChatPanel />);
    seedMessages([]);

    expect(await screen.findByTestId('chat-suggestions')).toBeInTheDocument();
  });

  it('hides suggestions once the thread has more than one message', async () => {
    renderWithProviders(<ChatPanel />);
    seedMessages([
      userMsg('u1', 'hi'),
      botMsg('b1', [{ type: 'text', content: 'hello', timestamp: TS }]),
    ]);

    await screen.findByTestId('chat-message-bot');
    expect(screen.queryByTestId('chat-suggestions')).not.toBeInTheDocument();
  });
});

describe('ChatPanel — composer scope label', () => {
  it('reflects the selected element name from the uiStore', async () => {
    renderWithProviders(<ChatPanel />);
    // Select the application "Data Loader" element in the model view.
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('application');
    useUiStore.getState().selectNode('a5342d6f-daf4-4a6e-a98b-7fada2561798');

    await waitFor(() =>
      expect(screen.getByText('Data Loader')).toBeInTheDocument(),
    );
  });

  it('falls back to "{layer} layer" when only a layer is selected', async () => {
    renderWithProviders(<ChatPanel />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('technology');

    await waitFor(() =>
      expect(screen.getByText('Technology layer')).toBeInTheDocument(),
    );
  });
});

describe('ChatPanel — composer submit', () => {
  it('submitting the composer calls chatService.sendMessage with the text', async () => {
    const user = userEvent.setup();
    const sendSpy = vi
      .spyOn(chatService, 'sendMessage')
      .mockResolvedValue({} as never);

    renderWithProviders(<ChatPanel />);
    seedMessages([]);

    const textarea = await screen.findByPlaceholderText('Ask about the model…');
    await user.type(textarea, 'Explain the API layer');
    // Enter (without shift) submits.
    await user.keyboard('{Enter}');

    await waitFor(() => expect(sendSpy).toHaveBeenCalledTimes(1));
    expect(sendSpy).toHaveBeenCalledWith('Explain the API layer');
  });

  it('clicking a suggestion sends it', async () => {
    const user = userEvent.setup();
    const sendSpy = vi
      .spyOn(chatService, 'sendMessage')
      .mockResolvedValue({} as never);

    renderWithProviders(<ChatPanel />);
    seedMessages([]);

    const suggestions = await screen.findByTestId('chat-suggestions');
    const first = within(suggestions).getAllByRole('button')[0];
    const label = first.textContent!.trim();
    await user.click(first);

    await waitFor(() => expect(sendSpy).toHaveBeenCalledTimes(1));
    expect(sendSpy).toHaveBeenCalledWith(label);
  });

  it('surfaces the SDK-unavailable error from the store', async () => {
    renderWithProviders(<ChatPanel />);
    useChatStore.setState({ error: '-32001 no chat client' });

    const alert = await screen.findByTestId('chat-store-error');
    expect(alert).toHaveTextContent(/No chat client is available/i);
  });
});
