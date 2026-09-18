import React, { useState, useEffect, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { CurrentUser, ChatMessage } from '../types';
import { RoutePath } from '../services/navigation';
import { 
  Users, 
  Search, 
  MessageSquare, 
  ArrowLeft, 
  Crown, 
  UserCheck, 
  Clock, 
  MessageCircle, 
  Radio, 
  Sparkles,
  Phone,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { SoundFx } from '../services/soundFx';
import { NeonCorners } from '../components/NeonCorners';
import { MarqueeText } from '../components/MarqueeText';

export interface TeamContact {
  id: string;
  name: string;
  role: string;
  username?: string;
  whatsapp?: string;
  isOwner?: boolean;
  avatarUrl?: string;
}

interface ContactListViewProps {
  currentUser: CurrentUser;
  onNavigate: (path: RoutePath) => void;
  onStartDirectChat: (contactId: string) => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ContactListView: React.FC<ContactListViewProps> = ({
  currentUser,
  onNavigate,
  onStartDirectChat,
  onNotify,
}) => {
  const [contacts, setContacts] = useState<TeamContact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'host' | 'admin' | 'ops'>('all');

  const storeId = currentUser.storeId;

  // Load team contacts
  useEffect(() => {
    const store = StorageService.getStoreById(storeId);
    const employees = StorageService.getEmployees(storeId);
    const teamList: TeamContact[] = [];

    // If current user is not owner, add Owner as primary contact
    if (!currentUser.isOwner && store) {
      teamList.push({
        id: 'owner',
        name: store.ownerUsername ? `Owner (${store.ownerUsername})` : 'Owner Toko',
        role: 'owner',
        username: store.ownerUsername,
        isOwner: true,
      });
    }

    // Add all active employees
    employees.forEach((emp) => {
      if (emp.id !== currentUser.id && emp.isActive !== false) {
        teamList.push({
          id: emp.id,
          name: emp.name || emp.username,
          role: emp.roles?.[0] || 'staff',
          username: emp.username,
          whatsapp: emp.whatsapp,
          avatarUrl: emp.avatarUrl,
          isOwner: false,
        });
      }
    });

    setContacts(teamList);
  }, [storeId, currentUser.id, currentUser.isOwner]);

  // Subscribe to messages for last chat preview
  useEffect(() => {
    const unsubscribe = StorageService.subscribeChatMessages(storeId, (newMsgs) => {
      setMessages(newMsgs);
    });

    return () => {
      unsubscribe();
    };
  }, [storeId]);

  // Helper to find last message exchanged with a contact
  const getLastMessageWith = (contact: TeamContact): ChatMessage | null => {
    const personal = messages.filter((m) => {
      const isSentByMe = m.senderId === currentUser.id;
      const isSentByContact = m.senderId === contact.id || (contact.isOwner && m.senderRole === 'owner');
      const isToContact = m.recipientId === contact.id || (contact.isOwner && m.recipientId === 'owner');
      const isToMe = m.recipientId === currentUser.id || (currentUser.isOwner && m.recipientId === 'owner');

      return (isSentByMe && isToContact) || (isSentByContact && isToMe);
    });

    if (personal.length === 0) return null;
    return personal[personal.length - 1];
  };

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Role filter
      if (roleFilter === 'owner' && !c.isOwner && c.role !== 'owner' && c.role !== 'manager') {
        return false;
      }
      if (roleFilter === 'host' && !c.role.toLowerCase().includes('host')) {
        return false;
      }
      if (roleFilter === 'admin' && !c.role.toLowerCase().includes('admin')) {
        return false;
      }
      if (roleFilter === 'ops' && !c.role.toLowerCase().includes('sortir') && !c.role.toLowerCase().includes('steam') && !c.role.toLowerCase().includes('staff')) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchUser = c.username?.toLowerCase().includes(q);
        const matchRole = c.role?.toLowerCase().includes(q);
        if (!matchName && !matchUser && !matchRole) return false;
      }

      return true;
    });
  }, [contacts, roleFilter, searchQuery]);

  const handleStartChat = (contactId: string, contactName: string) => {
    SoundFx.playRobotButtonClick();
    onNotify?.(`Membuka percakapan pribadi dengan ${contactName}...`, 'info');
    onStartDirectChat(contactId);
  };

  const getRoleBadge = (contact: TeamContact) => {
    if (contact.isOwner || contact.role === 'owner') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#25F4EE]/10 text-[#25F4EE] border border-[#25F4EE]/30 flex items-center gap-1">
          <Crown className="w-3 h-3" />
          Owner Toko
        </span>
      );
    }
    if (contact.role.includes('host')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center gap-1">
          <Radio className="w-3 h-3" />
          Host Live
        </span>
      );
    }
    if (contact.role.includes('admin')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-400/10 text-sky-400 border border-sky-400/30 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Admin Toko
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-400/10 text-teal-400 border border-teal-400/30 flex items-center gap-1">
        <UserCheck className="w-3 h-3" />
        {contact.role.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 space-y-4 text-white font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#161823] border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/informasi')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition border border-white/10 cursor-pointer active:scale-95 shrink-0"
            title="Kembali"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4 text-[#25F4EE]" />
          </button>

          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('/informasi/live-chat')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 text-xs font-bold transition cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25F4EE]" />
            <span>Buka Chat Grup Tim</span>
          </button>
        </div>
      </div>

      {/* Search & Role Filters */}
      <div className="p-3.5 bg-[#161823] rounded-2xl border border-white/10 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, username, atau posisi rekan kerja..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[#0b0c10] border border-white/10 text-white placeholder-zinc-500 focus:border-[#25F4EE] outline-none"
            />
          </div>

          <div className="text-xs text-zinc-400 font-semibold">
            Menampilkan: <strong className="text-white">{filteredContacts.length}</strong> kontak
          </div>
        </div>

        {/* Role Pills Filter */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'Semua Kontak' },
            { id: 'owner', label: 'Owner & Manager' },
            { id: 'host', label: 'Host Live' },
            { id: 'admin', label: 'Admin Toko' },
            { id: 'ops', label: 'Sortir, Steam & Staff' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-emerald-500/15 border border-emerald-400 text-emerald-300 shadow-sm'
                  : 'bg-[#0b0c10] border border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact Cards Grid */}
      {filteredContacts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#161823] rounded-2xl border border-white/10 space-y-3">
          <Users className="w-10 h-10 text-zinc-600 mx-auto" />
          <div className="text-zinc-400 text-sm font-semibold">
            Tidak ada kontak rekan kerja yang sesuai filter.
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
            }}
            className="text-xs text-[#25F4EE] hover:underline"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredContacts.map((contact) => {
            const lastMsg = getLastMessageWith(contact);
            const isMe = contact.id === currentUser.id;

            return (
              <div
                key={contact.id}
                className="spatial-card group p-4 rounded-2xl bg-[#161823]/90 hover:bg-[#1c1f2e] border border-white/10 hover:border-[#25F4EE]/50 transition-all shadow-md flex flex-col justify-between gap-3 relative overflow-hidden"
              >
                <NeonCorners color={contact.isOwner ? 'cyan' : contact.role.includes('host') ? 'magenta' : 'cyan'} />
                {/* Top: Avatar & Info */}
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base uppercase border shadow-md ${
                        contact.isOwner
                          ? 'bg-[#25F4EE]/10 border-[#25F4EE]/40 text-[#25F4EE]'
                          : contact.role.includes('host')
                          ? 'bg-amber-400/10 border-amber-400/40 text-amber-400'
                          : contact.role.includes('admin')
                          ? 'bg-sky-400/10 border-sky-400/40 text-sky-400'
                          : 'bg-teal-400/10 border-teal-400/40 text-teal-400'
                      }`}
                    >
                      {contact.name.charAt(0) || 'U'}
                    </div>
                    {/* Active online indicator dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#161823]" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-1 overflow-hidden">
                      <MarqueeText
                        text={contact.name}
                        className="text-xs sm:text-sm font-black text-white group-hover:text-[#25F4EE] transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {getRoleBadge(contact)}
                      {contact.username && (
                        <span className="text-[10px] text-zinc-400 truncate">
                          @{contact.username}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Last Chat Preview */}
                <div className="p-2 rounded-xl bg-[#0b0c10]/70 border border-white/5 text-[11px] text-zinc-400 min-h-[36px] flex items-center">
                  {lastMsg ? (
                    <div className="truncate w-full">
                      <span className="text-zinc-500 mr-1">
                        {lastMsg.senderId === currentUser.id ? 'Anda:' : `${contact.name.split(' ')[0]}:`}
                      </span>
                      <span className="text-zinc-300">{lastMsg.text}</span>
                    </div>
                  ) : (
                    <span className="text-zinc-500 italic text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-zinc-600" />
                      Belum ada riwayat pesan pribadi
                    </span>
                  )}
                </div>

                {/* Bottom: Action Trigger Button */}
                <button
                  type="button"
                  id={`btn-chat-contact-${contact.id}`}
                  onClick={() => handleStartChat(contact.id, contact.name)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#25F4EE] text-black font-extrabold text-xs shadow-md shadow-[#25F4EE]/20 hover:bg-[#25F4EE]/90 transition cursor-pointer active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Mulai Chat Pribadi</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
