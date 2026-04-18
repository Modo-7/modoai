'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { useChatStore } from '@/lib/store';
import api from '@/lib/api';

export default function Home() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { messages, currentConversation, setCurrentConversation, setMessages } = useChatStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id);
    }
  }, [currentConversation]);

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-[#2f2f2f] flex items-center justify-between px-4">
          <h1 className="text-lg font-semibold">ModoAI</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Welcome to ModoAI</h2>
                <p className="text-gray-400">Your AI coding assistant</p>
              </div>
            </div>
          ) : (
            messages.map((message) => <ChatMessage key={message.id} message={message} />)
          )}
        </div>
        
        <ChatInput />
      </div>
    </div>
  );
}
