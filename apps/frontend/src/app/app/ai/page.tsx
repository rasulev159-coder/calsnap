'use client';

import { useState } from 'react';
import { useAiChat, useWeeklyReport } from '@/hooks/useApi';
import type { ChatMessage } from '@calsnap/shared';

export default function AiPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chatMutation = useAiChat();
  const { data: report } = useWeeklyReport();

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    const reply = await chatMutation.mutateAsync(input);
    setMessages((prev) => [...prev, reply]);
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 flex flex-col" style={{ height: 'calc(100vh - 5rem)' }}>
      <h1 className="text-xl font-bold mb-4">ИИ-помощник</h1>

      {/* Weekly report */}
      {report && (
        <div className="mb-4 rounded-2xl bg-primary-50 p-4 border border-primary-100">
          <h3 className="font-semibold text-sm text-primary-700 mb-2">Еженедельный отчёт</h3>
          <p className="text-sm text-gray-700 mb-2">{report.summary}</p>
          {report.positives?.length > 0 && (
            <div className="mb-1">
              <span className="text-xs font-medium text-green-600">Хорошо: </span>
              <span className="text-xs text-gray-600">{report.positives.join(', ')}</span>
            </div>
          )}
          {report.improvements?.length > 0 && (
            <div className="mb-1">
              <span className="text-xs font-medium text-amber-600">Улучшить: </span>
              <span className="text-xs text-gray-600">{report.improvements.join(', ')}</span>
            </div>
          )}
          {report.tip && (
            <p className="text-xs text-primary-600 mt-2 italic">{report.tip}</p>
          )}
        </div>
      )}

      {/* Chat */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-sm">Задайте вопрос о питании или здоровье</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'ml-auto bg-primary text-white'
                : 'bg-white border border-gray-100 shadow-sm'
            }`}
          >
            {msg.content}
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 max-w-[80%] shadow-sm">
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" />
              <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 pb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Введите сообщение..."
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={sendMessage}
          disabled={chatMutation.isPending || !input.trim()}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition disabled:opacity-50"
        >
          →
        </button>
      </div>
    </div>
  );
}
