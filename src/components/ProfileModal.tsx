import React, { useState, useEffect } from 'react';
import { CurrentUser } from '../types';
import { StorageService } from '../services/storage';
import { SoundFx } from '../services/soundFx';
import { roleLabels } from '../utils/formatters';
import { 
  X, 
  User, 
  Camera, 
  Phone, 
  FileText, 
  Shield, 
  Store, 
  Check, 
  MessageCircle, 
  Sparkles,
  Upload
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onProfileUpdated: (updatedUser: CurrentUser) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  onNotify,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [whatsapp, setWhatsapp] = useState(currentUser.whatsapp || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name || '');
      setWhatsapp(currentUser.whatsapp || '');
      setBio(currentUser.bio || '');
      setAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle local image file upload (converts to base64)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onNotify('Ukuran foto maksimal 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setAvatarUrl(base64);
          SoundFx.playRobotButtonClick();
          onNotify('Foto profil siap disimpan', 'info');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onNotify('Nama tidak boleh kosong', 'error');
      return;
    }

    setIsSaving(true);
    SoundFx.playRobotButtonClick();

    try {
      const updated = StorageService.updateUserProfile({
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
      });

      if (updated) {
        onProfileUpdated(updated);
        onNotify('Profil berhasil diperbarui!', 'success');
        SoundFx.playProcessingSound();
        onClose();
      } else {
        onNotify('Gagal menyimpan profil', 'error');
      }
    } catch {
      onNotify('Terjadi kesalahan saat menyimpan profil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // WhatsApp quick link formatter (removes leading 0, non-digits)
  const cleanPhone = whatsapp.replace(/\D/g, '').replace(/^0/, '62');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        id="modal-user-profile"
        className="spatial-card relative w-full max-w-lg rounded-3xl border border-[#25F4EE]/40 bg-[#121520] text-white p-6 shadow-[0_0_50px_rgba(37,244,238,0.2)] overflow-hidden space-y-5"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#25F4EE]/20 to-[#FE2C55]/20 border border-[#25F4EE]/50 flex items-center justify-center text-[#25F4EE] shadow-[0_0_15px_rgba(37,244,238,0.3)]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide text-white flex items-center gap-2">
                PROFIL PENGGUNA
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#25F4EE]/10 border border-[#25F4EE]/40 text-[#25F4EE] font-mono">
                  {currentUser.isOwner ? 'OWNER' : 'TIM TOKO'}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Kelola foto, WhatsApp, dan informasi peran Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-profile-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card & Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          {/* Avatar Preview */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#25F4EE]/60 shadow-[0_0_20px_rgba(37,244,238,0.3)] bg-[#1a1d2d] flex items-center justify-center">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-2xl font-black text-[#25F4EE]">
                  {name.slice(0, 2).toUpperCase() || 'SP'}
                </div>
              )}
            </div>

            {/* Hidden File Input & Upload Trigger */}
            <label 
              htmlFor="profile-photo-upload"
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#25F4EE] text-black hover:bg-white transition shadow-lg cursor-pointer active:scale-95"
              title="Upload Foto dari Perangkat"
            >
              <Camera className="w-4 h-4" />
              <input 
                id="profile-photo-upload"
                type="file" 
                accept="image/*" 
                onChange={handleImageFileChange}
                className="hidden" 
              />
            </label>
          </div>

          {/* User Role & Store Metadata */}
          <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              {currentUser.roles.map(r => (
                <span 
                  key={r}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20 flex items-center gap-1"
                >
                  <Shield className="w-3 h-3 text-[#25F4EE]" />
                  {roleLabels[r] || r}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-zinc-400">
              <Store className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">{currentUser.storeName || 'Toko Fashion'}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-500">@{currentUser.username}</span>
            </div>

            {/* Quick avatar preset pickers */}
            <div className="pt-2">
              <div className="text-[10px] font-mono text-zinc-400 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FE2C55]" />
                Pilih Preset Avatar Cepat:
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                {AVATAR_PRESETS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(url);
                      SoundFx.playRobotButtonClick();
                    }}
                    className={`w-7 h-7 rounded-lg overflow-hidden border transition active:scale-90 ${
                      avatarUrl === url ? 'border-[#25F4EE] scale-105' : 'border-white/20 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Input Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#25F4EE]" />
              Nama Lengkap / Panggilan
            </label>
            <input
              id="input-profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Siti Rahma (Host Live)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#25F4EE] transition"
              required
            />
          </div>

          {/* Input No WhatsApp */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Nomor WhatsApp
              </label>
              {cleanPhone && (
                <a 
                  href={`https://wa.me/${cleanPhone}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline"
                >
                  <MessageCircle className="w-3 h-3" />
                  Uji Chat WA
                </a>
              )}
            </div>
            <input
              id="input-profile-whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Contoh: 081234567890"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-400 transition font-mono"
            />
          </div>

          {/* Input Bio / Motto */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              Bio / Motto Peran
            </label>
            <textarea
              id="input-profile-bio"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tuliskan catatan peran atau motto Anda (Contoh: Host live energik spesialis thrift vintage & bundling)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-400 transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-save-profile"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#25F4EE] to-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(37,244,238,0.4)] active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
