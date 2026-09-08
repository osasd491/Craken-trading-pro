import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Headphones,
  Mail,
  CheckCheck,
  Zap,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ClientUser } from '../../types';
import { StoreService } from '../../services/store';
import { translations } from '../../services/translations';

interface BoltChatWidgetProps {
  user: ClientUser;
  currentLanguage: string;
}

export const BoltChatWidget: React.FC<BoltChatWidgetProps> = ({ user, currentLanguage }) => {
  const t = translations[currentLanguage] || translations.en;
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const storeState = StoreService.getState();
  const supportEmail = storeState.adminConfig.supportEmail || 'crakenprotrading@gmail.com';

  useEffect(() => {
    const unsubscribe = StoreService.subscribe((state) => {
      const userChats = state.chats.filter((c) => c.userId === user.id);
      setMessages(userChats);

      if (!isOpen) {
        const unread = userChats.filter((c) => c.sender === 'admin' && !c.read).length;
        setUnreadCount(unread);
      }
    });

    return unsubscribe;
  }, [user.id, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      StoreService.markChatsRead(user.id);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, messages.length, user.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    StoreService.sendChatMessage({
      userId: user.id,
      userName: user.name,
      sender: 'client',
      message: inputText.trim()
    });

    setInputText('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          id="bolt-chat-toggle-btn"
          onClick={() => setIsOpen(true)}
          className="relative group p-4 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-cyan-400/30 shadow-cyan-500/30"
          title="Bolt Direct Broker Support"
        >
          <Zap className="w-6 h-6 text-amber-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-950 animate-bounce">
              {unreadCount}
            </span>
          )}
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
            Bolt Support
          </span>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-900/90 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-amber-300">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <span>Bolt Direct Desk</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-cyan-400" />
                  <span>{supportEmail}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Notice Banner */}
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              End-to-End Encrypted Broker Desk
            </span>
            <span className="text-emerald-400 font-semibold text-[10px]">Online 24/7</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/90">
            {/* System welcome greeting */}
            <div className="text-center my-2">
              <span className="text-[10px] px-3 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                Connected to craken Pro Official Trading Desk
              </span>
            </div>

            {messages.map((msg) => {
              const isMe = msg.sender === 'client';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-sm shadow-md'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-sm shadow-md'
                    }`}
                  >
                    {!isMe && (
                      <div className="text-[10px] font-bold text-amber-300 mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Broker Executive
                      </div>
                    )}
                    <p>{msg.message}</p>
                    <div
                      className={`text-[9px] mt-1 text-right font-mono ${
                        isMe ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.boltChatPlaceholder}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
