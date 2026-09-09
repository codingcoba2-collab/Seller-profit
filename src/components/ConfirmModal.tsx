import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, HelpCircle, Trash2, X } from 'lucide-react';

export type ConfirmActionType = 'create' | 'edit' | 'save' | 'delete' | 'warning';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ConfirmActionType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  type = 'save',
  confirmText,
  cancelText = 'Batal',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Configuration based on type
  const isDelete = type === 'delete';
  const defaultConfirmText = isDelete
    ? 'Ya, Hapus'
    : type === 'create'
    ? 'Ya, Buat'
    : type === 'edit'
    ? 'Ya, Ubah'
    : 'Ya, Simpan';

  const resolvedConfirmText = confirmText || defaultConfirmText;

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className="w-6 h-6 text-[#FE2C55]" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
      case 'create':
        return <CheckCircle className="w-6 h-6 text-[#25F4EE]" />;
      case 'edit':
        return <HelpCircle className="w-6 h-6 text-sky-400" />;
      case 'save':
      default:
        return <CheckCircle className="w-6 h-6 text-[#25F4EE]" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'delete':
        return 'bg-[#FE2C55]/15 border-[#FE2C55]/30';
      case 'warning':
        return 'bg-amber-400/15 border-amber-400/30';
      case 'create':
      case 'save':
      default:
        return 'bg-[#25F4EE]/15 border-[#25F4EE]/30';
      case 'edit':
        return 'bg-sky-400/15 border-sky-400/30';
    }
  };

  const getButtonClass = () => {
    if (isDelete) {
      return 'bg-[#FE2C55] hover:bg-[#FE2C55]/90 text-white shadow-lg shadow-[#FE2C55]/25 border border-[#FE2C55]/50';
    }
    return 'bg-[#25F4EE] hover:bg-[#25F4EE]/90 text-zinc-950 shadow-lg shadow-[#25F4EE]/25 border border-[#25F4EE]/50 font-black';
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="dialog-confirmation-card"
        className="relative w-full max-w-md bg-[#161823] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-4"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          id="btn-close-confirm-modal"
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${getIconBg()}`}>
            {getIcon()}
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-base sm:text-lg font-black text-white leading-snug">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed break-words">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <button
            type="button"
            id="btn-cancel-confirm-action"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-bold text-xs transition border border-white/10 cursor-pointer active:scale-95"
          >
            {cancelText}
          </button>
          <button
            type="button"
            id="btn-execute-confirm-action"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${getButtonClass()}`}
          >
            {resolvedConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
