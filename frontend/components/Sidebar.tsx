'use client';

import { useEffect, useState } from 'react';
import { useChatStore } from '@/lib/store';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function Sidebar() {
  const { conversations, setConversations, currentConversation, setCurrentConversation } = useChatStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversation(null);
    useChatStore.setState({ messages: [] });
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/conversations/${id}`);
      await fetchConversations();
      if (currentConversation?.id === id) {
        handleNewConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  return (
    <div className="w-64 bg-[#171717] border-r border-[#2f2f2f] flex flex-col h-screen">
      <button
        onClick={handleNewConversation}
        className="m-2 p-3 rounded-lg border border-[#3f3f3f] hover:bg-[#2f2f2f] transition-colors flex items-center gap-2 text-sm"
      >
        <Plus size={16} />
        New chat
      </button>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-sm text-gray-500 text-center py-4">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">No conversations yet</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setCurrentConversation(conv)}
              className={cn(
                "group flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-[#2f2f2f] transition-colors text-sm",
                currentConversation?.id === conv.id && "bg-[#2f2f2f]"
              )}
            >
              <MessageSquare size={16} />
              <span className="flex-1 truncate">{conv.title}</span>
              <button
                onClick={(e) => handleDeleteConversation(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#3f3f3f] rounded transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
