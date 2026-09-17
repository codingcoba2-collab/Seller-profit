import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CurrentUser, ChatMessage } from '../types';
import { StorageService } from '../services/storage';
import { SoundFx } from '../services/soundFx';
import { roleLabels } from '../utils/formatters';
import { RoutePath } from '../services/navigation';
import {
  Send,
  MessageSquare,
  Users,
  User,
  Trash2,
  ArrowLeft,
  Volume2,
  VolumeX,
  Search,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Radio,
  BookUser
} from 'lucide-react';

interface LiveChatViewProps {
  currentUser: CurrentUser;
  onNavigate: (route: RoutePath) => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  initialContactId?: string | null;
}

interface TeamContact {
  id: string;
  name: string;
  role: string;
  username?: string;
  isOwner?: boolean;
}

export const LiveChatView: React.FC<LiveChatViewProps> = ({
  currentUser,
  onNavigate,
  onNotify,
  initialContactId,
}) => {
  const [activeTab, setActiveTab] = useState<'group' | 'personal'>('group');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<TeamContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<TeamContact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<'umum' | 'urgent' | 'live' | 'shift'>('umum');
  const [isSending, setIsSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Load store team contacts (Owner + Employees)
  useEffect(() => {
    const store = StorageService.getStoreById(currentUser.storeId);
    const employees = StorageService.getEmployees(currentUser.storeId);
    const teamList: TeamContact[] = [];

    // If current user is not owner, add Owner as a primary contact
    if (!currentUser.isOwner && store) {
      teamList.push({
        id: 'owner',
        name: store.ownerUsername ? `Owner (${store.ownerUsername})` : 'Owner Toko',
        role: 'owner',
        username: store.ownerUsername,
        isOwner: true,
      });
    }

    // Add all active employees excluding current user
    employees.forEach((emp) => {
      if (emp.id !== currentUser.id && emp.isActive !== false) {
        teamList.push({
          id: emp.id,
          name: emp.name || emp.username,
          role: emp.roles?.[0] || 'staff',
          username: emp.username,
          isOwner: false,
        });
      }
    });

    setContacts(teamList);

    // If initial contact is requested
    if (initialContactId) {
      const match = teamList.find(c => c.id === initialContactId);
      if (match) {
        setSelectedContact(match);
        setActiveTab('personal');
        return;
      }
    }

    if (!selectedContact && teamList.length > 0) {
      setSelectedContact(teamList[0]);
    }
  }, [currentUser.storeId, currentUser.id, currentUser.isOwner, initialContactId]);

  // Subscribe to real-time chat messages
  useEffect(() => {
    const unsubscribe = StorageService.subscribeChatMessages(
      currentUser.storeId,
      (newMessages) => {
        setMessages(newMessages);

        // Sound alert on new incoming message from someone else
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

  // Auto scroll to bottom of active conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab, selectedContact]);

  // Filter messages based on active tab and selected personal contact
  const displayedMessages = useMemo(() => {
    if (activeTab === 'group') {
      // Group chat shows messages with no recipient or recipient='all'
      return messages.filter((m) => !m.recipientId || m.recipientId === 'all');
    }

    if (!selectedContact) return [];

    // Personal chat: 1-on-1 between currentUser and selectedContact
    return messages.filter((m) => {
      const isSentByMe = m.senderId === currentUser.id;
      const isSentByContact = m.senderId === selectedContact.id || (selectedContact.isOwner && m.senderRole === 'owner');

      const isTargetedToContact =
        m.recipientId === selectedContact.id || (selectedContact.isOwner && m.recipientId === 'owner');
      const isTargetedToMe =
        m.recipientId === currentUser.id || (currentUser.isOwner && m.recipientId === 'owner');

      return (isSentByMe && isTargetedToContact) || (isSentByContact && isTargetedToMe);
    });
  }, [messages, activeTab, selectedContact, currentUser]);

  // Calculate unread/latest message preview for contacts
  const getContactLastMessage = (contactId: string, isContactOwner?: boolean) => {
    const directMsgs = messages.filter((m) => {
      const sentByMeToContact =
        m.senderId === currentUser.id && (m.recipientId === contactId || (isContactOwner && m.recipientId === 'owner'));
      const sentByContactToMe =
        (m.senderId === contactId || (isContactOwner && m.senderRole === 'owner')) &&
        (m.recipientId === currentUser.id || (currentUser.isOwner && m.recipientId === 'owner'));
      return sentByMeToContact || sentByContactToMe;
    });

    if (directMsgs.length === 0) return null;
    return directMsgs[directMsgs.length - 1];
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    try {
      if (soundEnabled) {
        SoundFx.playChatNotificationSound(true);
      }

      const isPersonal = activeTab === 'personal' && selectedContact;

      await StorageService.sendChatMessage(currentUser.storeId, {
        senderId: currentUser.id,
        senderName: currentUser.name || currentUser.username,
        senderRole: currentUser.roles[0] || 'staff',
        text,
        tag: isPersonal ? undefined : selectedTag,
        recipientId: isPersonal ? selectedContact.id : undefined,
        recipientName: isPersonal ? selectedContact.name : undefined,
        recipientRole: isPersonal ? selectedContact.role : undefined,
      });

      setInputText('');
      if (activeTab === 'group') {
        setSelectedTag('umum');
      }
    } catch {
      onNotify?.('Gagal mengirim pesan chat.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleClearCurrentChat = async () => {
    if (activeTab === 'group') {
      if (!window.confirm('Bersihkan semua riwayat chat grup tim?')) return;
      await StorageService.clearChatMessages(currentUser.storeId);
      onNotify?.('Riwayat chat grup tim telah dibersihkan.', 'info');
    } else if (selectedContact) {
      if (!window.confirm(`Hapus riwayat obrolan dengan ${selectedContact.name}?`)) return;
      // Filter out messages for this conversation
      const remaining = messages.filter((m) => {
        const isSentByMe = m.senderId === currentUser.id && (m.recipientId === selectedContact.id || (selectedContact.isOwner && m.recipientId === 'owner'));
        const isSentByContact = (m.senderId === selectedContact.id || (selectedContact.isOwner && m.senderRole === 'owner')) && (m.recipientId === currentUser.id || (currentUser.isOwner && m.recipientId === 'owner'));
        return !(isSentByMe || isSentByContact);
      });
      StorageService.saveChatMessagesLocally(currentUser.storeId, remaining);
      setMessages(remaining);
      onNotify?.(`Riwayat chat dengan ${selectedContact.name} telah dibersihkan.`, 'info');
    }
  };

  const formatChatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.username && c.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickPhrasesGroup = [
    { label: '📹 Live Dimulai', text: 'Sesi Shopee Live resmi dimulai! Standby ya tim.', tag: 'live' as const },
    { label: '⚠️ Stok Menipis', text: 'Perhatian: Stok ukuran utama tersisa sedikit!', tag: 'urgent' as const },
    { label: '📦 Cek Paket Retur', text: 'Ada paket retur baru tiba, tolong di-QC ya sortir.', tag: 'shift' as const },
    { label: '⚡ Host Siap', text: 'Host shift berikutnya sudah siap di studio.', tag: 'shift' as const },
  ];

  const quickPhrasesPersonal = [
    'Halo, ada waktu sebentar?',
    'Tolong cek paket retur ya.',
    'Tugas shift ini sudah selesai.',
    'Bisa tolong bantu cek stok fisik?',
  ];

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'bg-amber-400/15 text-amber-300 border-amber-400/30';
      case 'host':
        return 'bg-[#25F4EE]/15 text-[#25F4EE] border-[#25F4EE]/30';
      case 'admin_toko':
      case 'admin':
        return 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30';
      case 'sortir':
        return 'bg-purple-400/15 text-purple-300 border-purple-400/30';
      case 'steam':
        return 'bg-sky-400/15 text-sky-300 border-sky-400/30';
      default:
        return 'bg-zinc-700/30 text-zinc-300 border-white/10';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 space-y-4 text-white font-sans">
      {/* 1. Top Header Bar */}
      <div className="bg-[#161823] p-3.5 sm:p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#0b0c10] border border-white/10 text-[#25F4EE] shrink-0">
            <Radio className="w-5 h-5 text-[#25F4EE]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">Chat Toko</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-[#25F4EE]/10 border-[#25F4EE]/40 text-[#25F4EE]'
                : 'bg-white/5 border-white/10 text-zinc-400'
            }`}
            title={soundEnabled ? 'Suara Aktif' : 'Suara Senyap'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Suara On' : 'Senyap'}</span>
          </button>

          {/* Clear Current Chat */}
          <button
            type="button"
            onClick={handleClearCurrentChat}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/40 text-zinc-300 hover:text-rose-400 transition cursor-pointer flex items-center gap-1.5"
            title="Bersihkan Obrolan Ini"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bersihkan</span>
          </button>

          {/* Back to Info */}
          <button
            type="button"
            onClick={() => onNavigate('/informasi')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 transition cursor-pointer"
            title="Kembali"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
          </button>
        </div>
      </div>

      {/* 2. Main Chat Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('group')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'group'
              ? 'bg-[#25F4EE] text-zinc-950 shadow-md font-black'
              : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Grup Tim ({contacts.length + 1})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'personal'
              ? 'bg-[#25F4EE] text-zinc-950 shadow-md font-black'
              : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Chat Personal 1-on-1</span>
          {contacts.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'personal' ? 'bg-zinc-900 text-white' : 'bg-white/10 text-zinc-300'
            }`}>
              {contacts.length} Kontak
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/informasi/kontak')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition cursor-pointer ml-auto border border-white/5"
        >
          <BookUser className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Daftar Kontak Lengkap</span>
          <span className="sm:hidden">Kontak</span>
        </button>
      </div>

      {/* 3. Chat Layout Container */}
      <div className="bg-[#161823] rounded-2xl border border-white/10 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[580px] sm:h-[620px]">
        {/* Left: Contact List (Only active when in 'personal' tab on Desktop, or when no contact selected on Mobile) */}
        {activeTab === 'personal' && (
          <div className={`md:col-span-4 border-r border-white/10 flex flex-col bg-[#0f111a] ${
            selectedContact ? 'hidden md:flex' : 'flex col-span-12'
          }`}>
            {/* Search Bar */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari rekan kerja / role..."
                  className="w-full bg-[#161823] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#25F4EE]"
                />
              </div>
            </div>

            {/* Contacts Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 space-y-1">
                  <User className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-xs font-bold">Tidak ada rekan kerja ditemukan</p>
                  <p className="text-[11px]">Tambahkan pegawai baru di menu Manajemen Pegawai.</p>
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedContact?.id === contact.id;
                  const lastMsg = getContactLastMessage(contact.id, contact.isOwner);

                  return (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#25F4EE]/10 border-l-4 border-[#25F4EE]' : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${
                          contact.isOwner
                            ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                            : 'bg-[#25F4EE]/10 border-[#25F4EE]/30 text-[#25F4EE]'
                        }`}>
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-[#0f111a]" />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                            {contact.name}
                          </h4>
                          {lastMsg && (
                            <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                              {formatChatTime(lastMsg.timestamp)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${getRoleBadgeStyle(contact.role)}`}>
                            {roleLabels[contact.role as keyof typeof roleLabels] || contact.role}
                          </span>
                          <p className="text-[11px] text-zinc-400 truncate flex-1">
                            {lastMsg ? lastMsg.text : 'Ketuk untuk kirim pesan'}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-zinc-500 hidden sm:block shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right: Message Stream Area */}
        <div className={`flex flex-col bg-[#141622] ${
          activeTab === 'personal'
            ? selectedContact ? 'col-span-12 md:col-span-8' : 'hidden md:flex md:col-span-8'
            : 'col-span-12'
        }`}>
          {/* Active Chat Room Sub-Header */}
          <div className="p-3 sm:p-3.5 border-b border-white/10 flex items-center justify-between gap-2 bg-[#161823]">
            {activeTab === 'group' ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#25F4EE]/10 border border-[#25F4EE]/30 text-[#25F4EE] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>Grup Tim Toko</span>
                    <span className="text-[10px] text-zinc-400 font-normal">({contacts.length + 1} anggota)</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">Pesan terbuka untuk seluruh tim</p>
                </div>
              </div>
            ) : selectedContact ? (
              <div className="flex items-center gap-2.5">
                {/* Back to Contacts button on Mobile */}
                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="md:hidden p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300"
                  title="Kembali ke Daftar Kontak"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
                  selectedContact.isOwner
                    ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                    : 'bg-[#25F4EE]/10 border-[#25F4EE]/30 text-[#25F4EE]'
                }`}>
                  {selectedContact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{selectedContact.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${getRoleBadgeStyle(selectedContact.role)}`}>
                      {roleLabels[selectedContact.role as keyof typeof roleLabels] || selectedContact.role}
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Obrolan Pribadi 1-on-1
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-400">Pilih kontak rekan kerja untuk mulai chat</div>
            )}
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
            {displayedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-500">
                <MessageSquare className="w-10 h-10 text-zinc-600" />
                <p className="text-sm font-bold text-zinc-400">
                  {activeTab === 'group'
                    ? 'Belum ada pesan di grup tim'
                    : selectedContact
                    ? `Belum ada pesan obrolan dengan ${selectedContact.name}`
                    : 'Pilih kontak untuk melihat percakapan'}
                </p>
                <p className="text-xs max-w-xs text-zinc-500">
                  Ketik pesan di bawah untuk memulai obrolan langsung.
                </p>
              </div>
            ) : (
              displayedMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    {/* Header info */}
                    <div className="flex items-center gap-1.5 px-1 text-[10px] text-zinc-400">
                      <span className="font-bold text-zinc-300">
                        {isMe ? 'Anda' : msg.senderName}
                      </span>
                      {activeTab === 'group' && (
                        <span className={`px-1 py-0.1 rounded text-[8px] font-bold uppercase border ${getRoleBadgeStyle(msg.senderRole)}`}>
                          {roleLabels[msg.senderRole as keyof typeof roleLabels] || msg.senderRole}
                        </span>
                      )}
                      {msg.tag && msg.tag !== 'umum' && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {msg.tag}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formatChatTime(msg.timestamp)}
                      </span>
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-xs ${
                        isMe
                          ? 'bg-[#1b253b] text-white border border-[#25F4EE]/40 rounded-tr-xs'
                          : 'bg-[#181a24] text-zinc-100 border border-white/10 rounded-tl-xs'
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

          {/* Quick Suggestions */}
          <div className="px-3 py-1.5 bg-[#0d0f16] border-t border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-zinc-500 uppercase shrink-0 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-[#25F4EE]" />
              Cepat:
            </span>
            {activeTab === 'group'
              ? quickPhrasesGroup.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(item.text);
                      setSelectedTag(item.tag);
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 whitespace-nowrap transition cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))
              : quickPhrasesPersonal.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(phrase)}
                    className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 whitespace-nowrap transition cursor-pointer"
                  >
                    {phrase}
                  </button>
                ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-[#161823] border-t border-white/10">
            {activeTab === 'group' && (
              <div className="flex items-center gap-1.5 text-xs mb-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase mr-1">Tag:</span>
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
                        ? 'bg-[#25F4EE]/20 border-[#25F4EE] text-[#25F4EE]'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                id="input-chat-message"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  activeTab === 'personal' && selectedContact
                    ? `Ketik pesan personal ke ${selectedContact.name}...`
                    : `Tulis pesan ke grup tim...`
                }
                maxLength={300}
                className="flex-1 bg-black/40 border border-white/15 focus:border-[#25F4EE] focus:ring-1 focus:ring-[#25F4EE] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 transition outline-none"
              />
              <button
                type="submit"
                id="btn-send-chat"
                disabled={!inputText.trim() || isSending || (activeTab === 'personal' && !selectedContact)}
                className="px-4 py-2 rounded-xl bg-[#25F4EE] text-zinc-950 hover:bg-[#25F4EE]/90 font-black text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                <span>Kirim</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
