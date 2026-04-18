'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`py-6 ${message.role === 'user' ? 'bg-[#212121]' : 'bg-transparent'}`}>
      <div className="max-w-3xl mx-auto px-4 flex gap-4">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
          {message.role === 'user' ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-sm font-medium">
              M
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const code = String(children).replace(/\n$/, '');

                if (!inline && language) {
                  return (
                    <div className="relative group">
                      <div className="flex items-center justify-between bg-[#1e1e1e] px-4 py-2 rounded-t-lg border-b border-[#3f3f3f]">
                        <span className="text-xs text-gray-400">{language}</span>
                        <button
                          onClick={() => handleCopy(code)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                      <SyntaxHighlighter
                        language={language}
                        style={vscDarkPlus}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                          borderBottomLeftRadius: 8,
                          borderBottomRightRadius: 8,
                        }}
                        {...props}
                      >
                        {code}
                      </SyntaxHighlighter>
                    </div>
                  );
                }
                return (
                  <code className="bg-[#2f2f2f] px-1.5 py-0.5 rounded text-sm" {...props}>
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return <p className="mb-4 last:mb-0">{children}</p>;
              },
              ul({ children }) {
                return <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>;
              },
              li({ children }) {
                return <li className="text-sm">{children}</li>;
              },
              h1({ children }) {
                return <h1 className="text-2xl font-bold mb-4">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-xl font-bold mb-3">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="text-lg font-bold mb-2">{children}</h3>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-[#3f3f3f] pl-4 italic mb-4 text-gray-300">
                    {children}
                  </blockquote>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
