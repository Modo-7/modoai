'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useChatStore } from '@/lib/store';
import api from '@/lib/api';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { currentConversation, addMessage, setCurrentConversation, messages } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to UI immediately
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          conversation_id: currentConversation?.id || null,
          content: userMessage,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      // Add empty assistant message that will be updated
      const assistantId = Date.now().toString() + '_assistant';
      addMessage({
        id: assistantId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      });

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  assistantContent += parsed.content;
                  // Update the assistant message in the store
                  useChatStore.setState((state) => ({
                    messages: state.messages.map((msg) =>
                      msg.id === assistantId
                        ? { ...msg, content: assistantContent }
                        : msg
                    ),
                  }));
                }
                if (parsed.done && parsed.conversation_id) {
                  setCurrentConversation({
                    id: parsed.conversation_id,
                    title: userMessage.slice(0, 50),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                }
              } catch (e) {
                // Ignore parse errors for [DONE] or incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage({
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        created_at: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-[#2f2f2f] p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-[#2f2f2f] rounded-xl p-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message ModoAI..."
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm placeholder-gray-400 max-h-32 overflow-y-auto"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          ModoAI can make mistakes. Consider checking important information.
        </p>
      </form>
    </div>
  );
}
