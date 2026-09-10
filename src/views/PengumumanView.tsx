import React, { useState, useEffect } from 'react';
import { CurrentUser, StoreAnnouncement } from '../types';
import { StorageService } from '../services/storage';
import { SoundFx } from '../services/soundFx';
import { RoutePath } from '../services/navigation';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit3, 
  Bell, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Clock, 
  Sparkles, 
  ArrowLeft,
  Volume2
} from 'lucide-react';
import { NeonCorners } from '../components/NeonCorners';

interface PengumumanViewProps {
  currentUser: CurrentUser;
  onNavigate: (route: RoutePath) => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PengumumanView: React.FC<PengumumanViewProps> = ({
  currentUser,
  onNavigate,
  onNotify,
}) => {
  const [announcements, setAnnouncements] = useState<StoreAnnouncement[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'penting' | 'urgent'>('penting');
  const [isActive, setIsActive] = useState(true);

  const loadAnnouncements = () => {
    const list = StorageService.getAnnouncements(currentUser.storeId);
    setAnnouncements(list);
  };

  useEffect(() => {
    loadAnnouncements();
    const unsub = StorageService.subscribe((event) => {
      if (event === 'announcements' || event === 'all') {
        loadAnnouncements();
      }
    });
    return () => unsub();
  }, [currentUser.storeId]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority('penting');
    setIsActive(true);
    setEditingId(null);
    setIsCreating(false);
  };

  const handleStartEdit = (item: StoreAnnouncement) => {
    setTitle(item.title);
    setContent(item.content);
    setPriority(item.priority);
    setIsActive(item.isActive);
    setEditingId(item.id);
    setIsCreating(true);
    SoundFx.playRobotButtonClick();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.isOwner) {
      onNotify?.('Hanya Owner yang berhak menerbitkan pengumuman toko.', 'error');
      return;
    }
    if (!title.trim() || !content.trim()) {
      onNotify?.('Judul dan isi pengumuman tidak boleh kosong.', 'error');
      return;
    }

    const newItem: StoreAnnouncement = {
      id: editingId || `ann-${Date.now()}`,
      storeId: currentUser.storeId,
      title: title.trim(),
      content: content.trim(),
      authorName: currentUser.name || 'Owner Toko',
      priority,
      isActive,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };

    StorageService.addOrUpdateAnnouncement(newItem);
    SoundFx.playProcessingSound();
    onNotify?.(
      editingId ? 'Pengumuman berhasil diperbarui!' : 'Pengumuman baru aktif di Live Info!',
      'success'
    );
    resetForm();
    loadAnnouncements();
  };

  const handleDelete = (id: string) => {
    if (!currentUser.isOwner) return;
    if (confirm('Yakin ingin menghapus pengumuman ini?')) {
      StorageService.deleteAnnouncement(id, currentUser.storeId);
      SoundFx.playRobotButtonClick();
      onNotify?.('Pengumuman dihapus.', 'info');
      loadAnnouncements();
    }
  };

  const handleToggleActive = (item: StoreAnnouncement) => {
    if (!currentUser.isOwner) return;
    const updated: StoreAnnouncement = {
      ...item,
      isActive: !item.isActive,
    };
    StorageService.addOrUpdateAnnouncement(updated);
    SoundFx.playRobotButtonClick();
    onNotify?.(
      updated.isActive ? 'Pengumuman diaktifkan ke teks berjalan Live Info.' : 'Pengumuman dinonaktifkan dari Live Info.',
      'info'
    );
    loadAnnouncements();
  };

  const activeCount = announcements.filter(a => a.isActive).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5 text-white font-sans">
      {/* Top Header & Breadcrumb */}
      <div className="spatial-card relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-[#FE2C55]/30 bg-[#121520] shadow-lg overflow-hidden">
        <NeonCorners variant="side-left" color="magenta" />
        <div className="flex items-center gap-3 relative z-10">
          <button
            type="button"
            id="btn-back-to-informasi"
            onClick={() => onNavigate('/informasi')}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition border border-white/10 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
            title="Kembali ke Kategori Informasi"
          >
            <ArrowLeft className="w-4 h-4 text-[#FE2C55]" />
            <span className="hidden sm:inline">Kategori Informasi</span>
          </button>
          <div className="w-10 h-10 rounded-2xl bg-[#FE2C55]/15 border border-[#FE2C55]/40 flex items-center justify-center text-[#FE2C55] shadow-[0_0_15px_rgba(254,44,85,0.3)]">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wide text-white">
                PENGUMUMAN TOKO (LIVE INFO)
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#FE2C55]/20 border border-[#FE2C55]/50 text-[#FE2C55] text-[10px] font-black uppercase font-mono animate-pulse">
                {activeCount} AKTIF DI RUNNING TEXT
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Input pengumuman penting oleh Owner yang langsung disiarkan ke teks berjalan (Live Info)
            </p>
          </div>
        </div>

        {currentUser.isOwner && !isCreating && (
          <button
            type="button"
            id="btn-open-create-announcement"
            onClick={() => {
              resetForm();
              setIsCreating(true);
              SoundFx.playRobotButtonClick();
            }}
            className="relative z-10 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FE2C55] to-purple-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(254,44,85,0.4)] hover:opacity-95 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Buat Pengumuman Baru</span>
          </button>
        )}
      </div>

      {/* Live Preview Ticker of Active Announcements */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FE2C55]/15 via-black/40 to-[#25F4EE]/10 border border-[#FE2C55]/30 flex items-center gap-3 overflow-hidden shadow-inner">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FE2C55] text-white font-black text-[11px] tracking-wider uppercase shrink-0 shadow-[0_0_12px_#FE2C55]">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>LIVE TICKER</span>
        </div>
        <div className="truncate text-xs font-semibold text-zinc-200">
          {announcements.filter(a => a.isActive).length > 0 ? (
            announcements.filter(a => a.isActive).map(a => `📢 [${a.priority.toUpperCase()}]: ${a.title} - ${a.content}`).join(' • ')
          ) : (
            'Belum ada pengumuman aktif. Teks berjalan akan menampilkan metrik omzet dan stok toko default.'
          )}
        </div>
      </div>

      {/* Owner Form: Create or Edit Announcement */}
      {currentUser.isOwner && isCreating && (
        <div className="spatial-card rounded-3xl p-5 border border-[#FE2C55]/40 bg-[#121520] space-y-4 shadow-[0_0_30px_rgba(254,44,85,0.2)] animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FE2C55]" />
              {editingId ? 'EDIT PENGUMUMAN PENTING' : 'BUAT PENGUMUMAN PENTING BARU'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Tutup Form
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Target Live Malam Ini 50 Paket / Bonus 500k"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FE2C55] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Tingkat Prioritas
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161823] border border-white/10 text-white text-sm focus:outline-none focus:border-[#FE2C55] transition"
                >
                  <option value="normal">Normal (Informasi Rutin)</option>
                  <option value="penting">Penting (Instruksi Tim)</option>
                  <option value="urgent">Urgent / Darurat (Target & SOP)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                Isi Pengumuman / Broadcast Pesan
              </label>
              <textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan instruksi detail yang wajib diketahui oleh host live, admin toko, dan tim sortir/steam..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#FE2C55] transition resize-none"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FE2C55] focus:ring-[#FE2C55] bg-black/40 border-white/20 cursor-pointer"
                />
                <span className="text-xs font-bold text-zinc-200">
                  Langsung siarkan di Teks Berjalan (Live Info Running Ticker)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-announcement"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FE2C55] to-pink-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(254,44,85,0.4)] active:scale-95 transition cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{editingId ? 'Simpan Perubahan' : 'Siarkan ke Live Info'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Announcements Feed List */}
      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#25F4EE]" />
          Daftar Pengumuman Toko ({announcements.length})
        </h2>

        {announcements.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
            <Megaphone className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-sm font-bold text-zinc-400">Belum ada pengumuman yang diterbitkan</p>
            {currentUser.isOwner && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 rounded-xl bg-[#FE2C55]/20 border border-[#FE2C55]/40 text-[#FE2C55] text-xs font-bold hover:bg-[#FE2C55]/30 transition"
              >
                Buat Pengumuman Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {announcements.map((item) => {
              const isUrgent = item.priority === 'urgent';
              const isPenting = item.priority === 'penting';

              return (
                <div
                  key={item.id}
                  className={`spatial-card relative p-4 rounded-2xl border transition-all duration-200 overflow-hidden ${
                    item.isActive
                      ? isUrgent
                        ? 'border-[#FE2C55]/50 bg-[#FE2C55]/5 shadow-[0_0_20px_rgba(254,44,85,0.15)]'
                        : isPenting
                        ? 'border-amber-400/40 bg-amber-400/5'
                        : 'border-[#25F4EE]/30 bg-[#25F4EE]/5'
                      : 'border-white/10 bg-white/[0.02] opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Priority Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider flex items-center gap-1 ${
                            isUrgent
                              ? 'bg-[#FE2C55] text-white shadow-[0_0_10px_#FE2C55]'
                              : isPenting
                              ? 'bg-amber-400 text-black'
                              : 'bg-[#25F4EE] text-black'
                          }`}
                        >
                          {isUrgent ? <Flame className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {item.priority}
                        </span>

                        {/* Live Info Ticker Status */}
                        {item.isActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5 animate-pulse" />
                            Tampil di Live Info
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400 text-[10px] font-bold">
                            Arsip / Non-Aktif
                          </span>
                        )}

                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.date}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-white leading-tight">
                        {item.title}
                      </h3>

                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                        {item.content}
                      </p>

                      <div className="text-[11px] text-zinc-400 pt-1">
                        Diterbitkan oleh: <span className="font-bold text-white">{item.authorName}</span>
                      </div>
                    </div>

                    {/* Owner Action Controls */}
                    {currentUser.isOwner && (
                      <div className="flex items-center gap-2 self-end sm:self-start shrink-0 pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            item.isActive
                              ? 'bg-white/10 hover:bg-white/20 text-zinc-300 border-white/10'
                              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/40'
                          }`}
                          title={item.isActive ? 'Nonaktifkan dari Live Info' : 'Aktifkan ke Live Info'}
                        >
                          {item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition border border-white/10 cursor-pointer"
                          title="Edit Pengumuman"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl bg-[#FE2C55]/10 hover:bg-[#FE2C55]/20 text-[#FE2C55] transition border border-[#FE2C55]/30 cursor-pointer"
                          title="Hapus Pengumuman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
