import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Check, CheckCheck, Landmark, ShieldCheck, Mail, ArrowLeft, MessageSquarePlus, Shield, Crown } from 'lucide-react';

interface InboxViewProps {
  conversations: Conversation[];
  onUpdateConversations: (updated: Conversation[]) => void;
}

export default function InboxView({ conversations, onUpdateConversations }: InboxViewProps) {
  const [activeId, setActiveId] = useState<string>(conversations[0]?.id || '');
  const [typedText, setTypedText] = useState('');
  const [viewingChatMobile, setViewingChatMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId);

  // Scroll to bottom on updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedText.trim() || !activeConversation) return;

    const userMessage: Message = {
      id: `m-user-${Date.now()}`,
      sender: 'user',
      text: typedText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...activeConversation.messages, userMessage];
    const updatedConv: Conversation = {
      ...activeConversation,
      messages: updatedMessages,
      lastMessage: typedText,
      lastUpdated: 'Just now'
    };

    const nextConversations = conversations.map((c) => (c.id === activeId ? updatedConv : c));
    onUpdateConversations(nextConversations);
    setTypedText('');

    // Trigger responsive Host simulator reply
    setTimeout(() => {
      const hostReplyText = getHostReplyPlaceholder(activeConversation.house.host.name, activeConversation.house.title, typedText);
      const hostMessage: Message = {
        id: `m-host-${Date.now()}`,
        sender: 'host',
        text: hostReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      const afterHostConv: Conversation = {
        ...updatedConv,
        messages: [...updatedMessages, hostMessage],
        lastMessage: hostReplyText,
        lastUpdated: 'Just now'
      };

      onUpdateConversations(conversations.map((c) => (c.id === activeId ? afterHostConv : c)));
    }, 1800);
  };

  // Generates customized host responses based on keywords found in typed text
  const getHostReplyPlaceholder = (hostName: string, title: string, input: string): string => {
    const text = input.toLowerCase();
    if (text.includes('hi') || text.includes('hello')) {
      return `Hello! Thank you for writing. I'm always pleased to chat about ${title}. Let me know how I can make your stays exceptional!`;
    }
    if (text.includes('wine') || text.includes('drink') || text.includes('dinner') || text.includes('food')) {
      return `Absolutely, I can coordinate with our local culinary partners to arrange that fine dining experience. Let me confirm availability and we'll handle the rest!`;
    }
    if (text.includes('price') || text.includes('discount') || text.includes('cost')) {
      return `Our rates are optimized daily to provide supreme value for a premium architectural residence. Let me know if there is anything details-wise we can tailor specifically for your length of stay.`;
    }
    if (text.includes('check') || text.includes('arrive') || text.includes('time')) {
      return `Standard check-in is at 3:00 PM, but I can coordinate an early drop-off for your luggage if there is no same-day checkout. Let me confirm with our staff first.`;
    }
    return `That sounds wonderful. I've noted down your remarks and will coordinate standard preparations. Please don't hesitate to write back if anything else comes to mind before you arrive!`;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl h-[calc(100vh-220px)] min-h-[550px] md:h-[650px] lg:h-[700px] flex backdrop-blur-2xl relative">
      {/* Sidebar List of Conversations */}
      <div className={`w-full md:w-80 border-r border-white/10 flex flex-col h-full bg-black/10 ${
        viewingChatMobile ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <h2 className="font-display font-semibold text-white text-sm">Host Contacts</h2>
          <span className="p-1.5 rounded-full bg-white/10 text-slate-300">
            <Mail className="w-4 h-4" />
          </span>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 pr-1">
          {conversations.length > 0 ? (
            conversations.map((c) => {
              const isActive = c.id === activeId;
              return (
                <button
                  id={`conv-tab-${c.id}`}
                  key={c.id}
                  onClick={() => {
                    setActiveId(c.id);
                    setViewingChatMobile(true);
                  }}
                  className={`w-full p-4 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                    isActive ? 'bg-white/10 border-l-[3px] border-indigo-500' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                    {c.house.host.name ? c.house.host.name.charAt(0) : '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-semibold text-xs text-white truncate">{c.house.host.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{c.lastUpdated}</span>
                    </div>
                    <p className="text-[11px] font-medium text-indigo-300 truncate mb-1">
                      {c.house.title}
                    </p>
                    <p className="text-xs text-slate-300 truncate leading-snug">{c.lastMessage}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No messages found. Book a stay to open a dedicated line with the estate superhost.
            </div>
          )}
        </div>
      </div>

      {/* Active Conversation Chat Window */}
      <div className={`flex-1 h-full flex flex-col justify-between bg-black/15 ${
        !viewingChatMobile ? 'hidden md:flex' : 'flex'
      }`}>
        {activeConversation ? (
          <>
            {/* Thread Header bar */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <button
                  id="inbox-back-to-list-mobile-btn"
                  onClick={() => setViewingChatMobile(false)}
                  className="md:hidden p-1.5 rounded-full hover:bg-white/10 text-white mr-1"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs uppercase shrink-0">
                  {activeConversation.house.host.name ? activeConversation.house.host.name.charAt(0) : '👤'}
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-white">{activeConversation.house.host.name}</h3>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    <span>Hosts the {activeConversation.house.location} residence</span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 text-slate-300 text-[10px] font-mono rounded-lg border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Verified Stay Connection</span>
              </div>
            </div>

            {/* Message History screen */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/5">
              {activeConversation.messages.map((m) => {
                const isUser = m.sender === 'user';
                const isCeo = m.sender === 'ceo';
                return (
                  <div
                    key={m.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] rounded-2xl p-3 text-xs leading-relaxed border ${
                      isUser
                        ? 'bg-indigo-600/90 border-indigo-500 text-white rounded-br-none'
                        : isCeo
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-100 rounded-bl-none shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                        : 'bg-white/10 border-white/5 text-slate-100 rounded-bl-none'
                    }`}>
                      {isCeo && (
                        <div className="flex items-center gap-1 mb-1 text-[10px] text-amber-400 font-extrabold uppercase tracking-wide">
                          <Crown className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          <span>CEO HQ Staff Support</span>
                        </div>
                      )}
                      <p>{m.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-70">
                        <span>{m.timestamp}</span>
                        {isUser && <CheckCheck className="w-3 h-3 text-indigo-200" />}
                        {isCeo && <ShieldCheck className="w-3 h-3 text-amber-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Thread Text Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-2 items-center bg-white/5">
              <input
                id="message-input-textbox"
                type="text"
                required
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder={`Ask ${activeConversation.house.host.name} about her stay...`}
                className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-400"
              />
              <button
                id="message-send-btn"
                type="submit"
                disabled={!typedText.trim()}
                className="p-3.5 rounded-xl bg-indigo-600 text-white disabled:bg-white/5 disabled:text-slate-500 hover:bg-indigo-500 active:scale-95 transition-all text-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <MessageSquarePlus className="w-12 h-12 text-slate-500 mb-3" />
            <h3 className="font-display font-medium text-sm text-white">No active discussion selected</h3>
            <p className="text-xs text-slate-400 mt-1">Tap is list on the left to start corresponding.</p>
          </div>
        )}
      </div>
    </div>
  );
}
