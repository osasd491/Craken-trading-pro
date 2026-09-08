import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Zap,
  User,
  Clock,
  CheckCheck,
  Search,
  Mail,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ClientUser } from '../../types';
import { StoreService } from '../../services/store';

export const AdminBoltChat: React.FC = () => {
  const storeState = StoreService.getState();
  const users = storeState.users;
  const chats = storeState.chats;

  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Group chats by user
  const selectedUser = users.find((u) => u.id === selectedUserId);
  const activeChatMessages = chats.filter((c) => c.userId === selectedUserId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages.length, selectedUserId]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUser) return;

    StoreService.sendChatMessage({
      userId: selectedUser.id,
      userName: selectedUser.name,
      sender: 'admin',
      message: replyText.trim()
    });

    setReplyText('');
  };

  const handleQuickTemplate = (text: string) => {
    setReplyText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Bolt Live Executive Support Desk</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time encrypted two-way communication with trading clients. Official Support: {storeState.adminConfig.supportEmail}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl min-h-[580px]">
        {/* Left: Client Chat Threads (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-800 bg-slate-950/40 flex flex-col">
          <div className="p-3.5 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {users
              .filter(
                (u) =>
                  u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((u) => {
                const userMsgs = chats.filter((c) => c.userId === u.id);
                const lastMsg = userMsgs[userMsgs.length - 1];
                const unreadFromClient = userMsgs.filter((c) => c.sender === 'client' && !c.read).length;
                const isSelected = u.id === selectedUserId;

                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-600/15 border-l-4 border-blue-500'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-bold text-xs text-white truncate">{u.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {lastMsg ? lastMsg.message : 'No messages yet'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {unreadFromClient > 0 && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md">
                          {unreadFromClient}
                        </span>
                      )}
                      {lastMsg && (
                        <span className="text-[9px] text-slate-500 block mt-1">
                          {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right: Active Chat Conversation (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950/60">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
                    {selectedUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{selectedUser.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                        Bal: ${selectedUser.balance.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{selectedUser.email}</span>
                      <span>•</span>
                      <span className="text-blue-400 font-mono">Profit: +${selectedUser.totalProfit.toLocaleString()} 📈</span>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono">
                  Active via {selectedUser.sessionInfo.browser}
                </div>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[380px]">
                {activeChatMessages.length === 0 ? (
                  <div className="py-20 text-center text-xs text-slate-500">
                    No previous messages with this client. Send a greeting below!
                  </div>
                ) : (
                  activeChatMessages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isAdmin
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-100 rounded-br-sm'
                              : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-sm'
                          }`}
                        >
                          <div className="text-[10px] font-bold mb-1 flex items-center gap-1 opacity-75">
                            {isAdmin ? 'You (Executive Broker Desk)' : `${selectedUser.name}`}
                          </div>
                          <p>{msg.message}</p>
                          <div className="text-[9px] mt-1 text-right text-slate-400 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Presets */}
              <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Quick Reply:</span>
                {[
                  'Hello! Your deposit was verified and credited to your trading balance.',
                  'Your withdrawal request has been approved and dispatched on-chain.',
                  'Your KYC identity documents have been approved by compliance desk.',
                  'We have credited your account with institutional trading arbitrage profit 📈.'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickTemplate(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[11px] text-slate-300 truncate max-w-[200px] shrink-0"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <form onSubmit={handleSendReply} className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply directly to ${selectedUser.name} on Bolt messenger...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              Select a client from the left pane to view conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
