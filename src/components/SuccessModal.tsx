import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { SoundFx } from '../services/soundFx';

interface SuccessModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  title = 'Data Berhasil Tersimpan!',
  message = 'Seluruh data transaksi dan kalkulasi telah diperbarui dan disinkronkan ke Cloud Firestore.',
  onConfirm,
}) => {
  useEffect(() => {
    if (isOpen) {
      SoundFx.playHologramOpen();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="holographic-modal w-full max-w-sm p-6 text-center text-white relative shadow-2xl">
            {/* Hologram Corner Reticles */}
            <div className="hologram-corner-tl" />
            <div className="hologram-corner-tr" />
            <div className="hologram-corner-bl" />
            <div className="hologram-corner-br" />

            {/* Top HUD indicator */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#25F4EE] mb-4">
              <Sparkles className="w-3 h-3 text-[#25F4EE]" />
              <span>HOLOGRAPHIC CONFIRMATION // SUCCESS</span>
            </div>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#25F4EE]/15 text-[#25F4EE] border border-[#25F4EE]/40 mb-4 shadow-[0_0_20px_rgba(37,244,238,0.35)]">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
            </div>

            <h3 className="text-lg font-black text-white mb-2">
              {title}
            </h3>

            <p className="text-xs text-zinc-300 mb-6 leading-relaxed">
              {message}
            </p>

            <button
              id="btn-confirm-success-modal"
              type="button"
              onClick={onConfirm}
              className="spatial-button w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#25F4EE] hover:bg-[#25F4EE]/90 px-5 py-3 text-xs font-black text-zinc-950 shadow-lg shadow-[#25F4EE]/25 border border-[#25F4EE]/50 transition active:scale-[0.98] cursor-pointer"
            >
              <span>Kembali ke Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
