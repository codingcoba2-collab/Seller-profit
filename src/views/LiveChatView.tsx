import React, { useState, useEffect, useRef } from 'react';
import { CurrentUser, ChatMessage } from '../types';
import { StorageService } from '../services/storage';
import { SoundFx } from '../services/soundFx';
import { roleLabels } from '../utils/formatters';
import { NeonCorners } from '../components/NeonCorners';
import { RoutePath } from '../services/navigation';
import {
  Send,
  MessageSquare,
  Sparkles,
  Radio,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Video,
  Users,
  Shield,
  ArrowLeft,
  Volume2,
  VolumeX
} from 'lucide-react';

interface LiveChatViewProps {
  currentUser: CurrentUser;
  onNavigate: (route: RoutePath) => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LiveChatView: React.FC<LiveChatViewProps> = ({
  currentUser,
  onNavigate,
  onNotify,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<'umum' | 'urgent' | 'live' | 'shift'>('umum');
  const [isSending, setIsSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Subscribe to real-time messages
  useEffect(() => {
    const unsubscribe = StorageService.subscribeChatMessages(
      currentUser.storeId,
      (newMessages) => {
        setMessages(newMessages);

        // If a new incoming message arrived from someone else, play chime
        if (newMessages.length > prevCountRef.current && prevCountRef.current > 0) {
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.senderId !== currentUser.id && soundEnabled) {
            SoundFx.playChatNotificationSound(false);
          }
        }
        prevCountRef.current = newMessages.length;
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser.storeId, currentUser.id, soundEnabled]);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    try {
      if (soundEnabled) {
        SoundFx.playChatNotificationSound(true);
      }

      await StorageService.sendChatMessage(currentUser.storeId, {
        senderId: currentUser.id,
        senderName: currentUser.name || currentUser.username,
        senderRole: currentUser.roles[0] || 'staff',
        text,
        tag: selectedTag,
      });

      setInputText('');
      // Reset tag to umum after sending
      setSelectedTag('umum');
    } catch {
      onNotify?.('Gagal mengirim pesan chat.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Bersihkan semua riwayat chat untuk toko ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }
    await StorageService.clearChatMessages(currentUser.storeId);
    onNotify?.('Riwayat live chat telah dibersihkan.', 'info');
  };

  const quickPhrases = [
    { label: '📹 Live Dimulai', text: 'Sesi Shopee Live resmi dimulai! Standby ya tim.', tag: 'live' as const },
    { label: '⚠️ Stok Menipis', text: 'Perhatian: Stok ukuran M dan L tersisa sedikit!', tag: 'urgent' as const },
    { label: '📦 Cek Paket Retur', text: 'Ada paket retur baru sampai, tolong di-QC ya sortir.', tag: 'shift' as const },
    { label: '⚡ Host Standby', text: 'Host shift berikutnya sudah siap di studio.', tag: 'shift' as const },
  ];

  const formatChatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 text-white font-sans">
      {/* 1. Holographic Header Bar */}
      <div className="spatial-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#25F4EE]/40 shadow-[0_0_25px_rgba(37,244,238,0.15)] relative overflow-hidden">
        <NeonCorners variant="side-left" color="cyan" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#161823] border border-[#25F4EE]/40 text-[#25F4EE] shadow-[0_0_15px_rgba(37,244,238,0.3)] shrink-0">
            <Radio className="w-5 h-5 animate-pulse text-[#25F4EE]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Live Chat Tim Toko</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  REAL-TIME ACTIVE
                </span>
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ruang koordinasi cepat antara Owner, Host Live, Admin Toko, Sortir &amp; Steam.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto relative z-10">
          {/* Audio toggle button */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
              soundEnabled
                ? 'bg-[#25F4EE]/10 border-[#25F4EE]/40 text-[#25F4EE] hover:bg-[#25F4EE]/20'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
            title={soundEnabled ? 'Suara Notifikasi Chat Aktif' : 'Suara Notifikasi Senyap'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Suara On' : 'Mute'}</span>
          </button>

          {/* Clear chat (Owner only) */}
          {currentUser.roles.includes('owner') && (
            <button
              type="button"
              onClick={handleClearChat}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/40 text-zinc-300 hover:text-rose-400 transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
              title="Bersihkan Semua Pesan Chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bersihkan</span>
            </button>
          )}

          {/* Back button */}
          <button
            type="button"
            onClick={() => onNavigate('/dashboard')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Beranda</span>
          </button>
        </div>
      </div>

      {/* 2. Main Holographic Chat Card */}
      <div className="spatial-card rounded-2xl border border-white/10 shadow-xl overflow-hidden flex flex-col h-[560px] sm:h-[620px] relative">
        <NeonCorners variant="side-left" color="cyan" />

        {/* Hologram top laser line */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#25F4EE] to-transparent opacity-80 animate-pulse" />

        {/* Messages Stream Container */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 divide-y divide-transparent relative z-10 scrollbar-thin scrollbar-thumb-white/10"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-500">
              <MessageSquare className="w-10 h-10 text-zinc-600 animate-bounce" />
              <p className="text-sm font-bold text-zinc-400">Belum ada pesan obrolan tim</p>
              <p className="text-xs max-w-sm">Mulai koordinasi pertama dengan tim Anda untuk persiapan live streaming atau penanganan pesanan.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const isSystem = msg.senderId === 'system-bot';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="px-3.5 py-1.5 rounded-full bg-[#25F4EE]/10 border border-[#25F4EE]/30 text-[#25F4EE] text-xs font-mono flex items-center gap-2 shadow-[0_0_12px_rgba(37,244,238,0.15)]">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>{msg.text}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center gap-2 px-1 text-[11px] text-zinc-400">
                    <span className="font-bold text-zinc-200">
                      {isMe ? 'Anda' : msg.senderName}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-white/10 text-zinc-300 border border-white/10">
                      {roleLabels[msg.senderRole as keyof typeof roleLabels] || msg.senderRole}
                    </span>
                    {msg.tag && msg.tag !== 'umum' && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                        msg.tag === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : msg.tag === 'live'
                          ? 'bg-[#FE2C55]/20 text-[#FE2C55] border border-[#FE2C55]/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {msg.tag === 'urgent' ? '🚨 URGENT' : msg.tag === 'live' ? '📹 LIVE' : '⏱️ SHIFT'}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {formatChatTime(msg.timestamp)}
                    </span>
                  </div>

                  {/* Message Bubble with holographic glow */}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-md transition-all ${
                      isMe
                        ? 'bg-gradient-to-r from-[#1b253b] to-[#12283a] text-white border border-[#25F4EE]/40 rounded-tr-xs shadow-[0_0_15px_rgba(37,244,238,0.12)]'
                        : 'bg-[#181a24] text-zinc-100 border border-white/10 rounded-tl-xs hover:border-white/20'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Phrase Suggestion Chips */}
        <div className="px-3 sm:px-4 py-2 bg-[#0d0f16]/90 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto relative z-10 scrollbar-none">
          <span className="text-[10px] font-bold text-zinc-500 uppercase shrink-0 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-[#25F4EE]" />
            Cepat:
          </span>
          {quickPhrases.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(phrase.text);
                setSelectedTag(phrase.tag);
              }}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/5 hover:bg-[#25F4EE]/15 border border-white/10 hover:border-[#25F4EE]/40 text-zinc-300 hover:text-[#25F4EE] whitespace-nowrap transition cursor-pointer active:scale-95 shrink-0"
            >
              {phrase.label}
            </button>
          ))}
        </div>

        {/* Input Bar & Tag Selector */}
        <div className="p-3 sm:p-4 bg-[#141622] border-t border-white/10 relative z-10 space-y-2">
          {/* Tag Selector Tabs */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold text-zinc-400 uppercase mr-1">Tag Pesan:</span>
            {[
              { id: 'umum' as const, label: 'Umum' },
              { id: 'live' as const, label: '📹 Live' },
              { id: 'urgent' as const, label: '🚨 Urgent' },
              { id: 'shift' as const, label: '⏱️ Shift' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTag(t.id)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                  selectedTag === t.id
                    ? 'bg-[#25F4EE]/20 border-[#25F4EE] text-[#25F4EE] shadow-[0_0_8px_rgba(37,244,238,0.3)]'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              id="input-live-chat-message"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Tulis pesan sebagai ${currentUser.name}...`}
              maxLength={300}
              className="flex-1 bg-black/50 border border-white/15 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 transition outline-none"
            />
            <button
              type="submit"
              id="btn-send-live-chat"
              disabled={!inputText.trim() || isSending}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#25F4EE] to-[#00c8e0] hover:from-[#3ffef8] hover:to-[#25F4EE] text-black font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-[0_0_15px_rgba(37,244,238,0.3)] shrink-0"
            >
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
