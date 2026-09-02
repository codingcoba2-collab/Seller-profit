import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  title = 'Data Berhasil Tersimpan!',
  message = 'Seluruh data transaksi dan kalkulasi telah diperbarui dan disinkronkan.',
  onConfirm,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-4 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {title}
            </h3>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {message}
            </p>

            <button
              id="btn-confirm-success-modal"
              onClick={onConfirm}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] cursor-pointer"
            >
              <span>Oke, Kembali ke Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
