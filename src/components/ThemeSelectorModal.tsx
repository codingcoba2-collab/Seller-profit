import React, { useState, useEffect } from 'react';
import { ThemeConfig, ThemeMode, ThemePalette } from '../types';
import { ThemeService, THEME_PALETTES } from '../services/theme';
import { Palette, Moon, Sun, Check, Sparkles, X } from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  onNotify,
}) => {
  const [theme, setTheme] = useState<ThemeConfig>(ThemeService.getTheme());

  useEffect(() => {
    if (isOpen) {
      setTheme(ThemeService.getTheme());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPalette = (palette: ThemePalette) => {
    const updated: ThemeConfig = { ...theme, palette };
    setTheme(updated);
    ThemeService.setTheme(updated);
    if (onNotify) {
      onNotify(`Tema warna diubah ke "${THEME_PALETTES[palette].name}"`, 'success');
    }
  };

  const handleToggleMode = (mode: ThemeMode) => {
    const updated: ThemeConfig = { ...theme, mode };
    setTheme(updated);
    ThemeService.setTheme(updated);
    if (onNotify) {
      onNotify(`Mode tampilan diubah ke ${mode === 'dark' ? 'Dark Mode' : 'Light Mode'}`, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161823] border border-white/15 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#25F4EE]/15 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Pengaturan Tema &amp; Warna
              </h3>
              <p className="text-xs text-zinc-400">
                Sesuaikan nuansa visual toko fashion &amp; kenyamanan mata
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Mode Switcher (Dark vs Light) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Mode Tampilan
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleToggleMode('dark')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border font-bold text-xs transition cursor-pointer ${
                  theme.mode === 'dark'
                    ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 border-[#25F4EE] text-white shadow-lg shadow-[#25F4EE]/10'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                }`}
              >
                <Moon className="w-4 h-4 text-[#25F4EE]" />
                <span>Dark Mode (Malam)</span>
                {theme.mode === 'dark' && <Check className="w-4 h-4 text-[#25F4EE] ml-auto" />}
              </button>

              <button
                type="button"
                onClick={() => handleToggleMode('light')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border font-bold text-xs transition cursor-pointer ${
                  theme.mode === 'light'
                    ? 'bg-gradient-to-r from-zinc-200 to-white border-amber-400 text-zinc-900 shadow-lg'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Mode (Terang)</span>
                {theme.mode === 'light' && <Check className="w-4 h-4 text-amber-600 ml-auto" />}
              </button>
            </div>
          </div>

          {/* Palette Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>Palet Warna Aksen Fashion</span>
              <span className="text-[10px] text-zinc-400 font-normal">Pilih nuansa sesuai brand</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(THEME_PALETTES) as ThemePalette[]).map(key => {
                const palette = THEME_PALETTES[key];
                const isSelected = theme.palette === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectPalette(key)}
                    className={`p-4 rounded-2xl border text-left transition relative cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white/10 border-white/40 shadow-xl ring-2 ring-[#25F4EE]/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div>
                      {/* Color dots preview */}
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <div
                          className="w-4 h-4 rounded-full shadow-xs border border-white/20"
                          style={{ backgroundColor: palette.previewColors[0] }}
                        />
                        <div
                          className="w-4 h-4 rounded-full shadow-xs border border-white/20"
                          style={{ backgroundColor: palette.previewColors[1] }}
                        />
                        <div
                          className="w-4 h-4 rounded-full shadow-xs border border-white/20"
                          style={{ backgroundColor: palette.previewColors[2] }}
                        />
                        {isSelected && (
                          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-[#25F4EE] bg-[#25F4EE]/10 px-2 py-0.5 rounded-full border border-[#25F4EE]/30">
                            <Check className="w-3 h-3" />
                            <span>Aktif</span>
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-xs text-white leading-tight">
                        {palette.name}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 leading-normal">
                        {palette.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#25F4EE] to-[#FE2C55] text-[#0b0c10] font-black text-xs transition hover:opacity-90 cursor-pointer shadow-lg shadow-[#25F4EE]/20"
          >
            Selesai &amp; Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};
