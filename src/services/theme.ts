import { ThemeConfig, ThemeMode, ThemePalette } from '../types';

const THEME_STORAGE_KEY = 'seller_profit_theme_config';

export interface ThemeDefinition {
  id: ThemePalette;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  bgDark: string;
  cardDark: string;
  bgLight: string;
  cardLight: string;
  badgeBg: string;
  badgeText: string;
  primaryGradient: string;
  previewColors: [string, string, string];
}

export const THEME_PALETTES: Record<ThemePalette, ThemeDefinition> = {
  neon: {
    id: 'neon',
    name: 'TikTok Neon & Cyber',
    description: 'Dynamic Cyan & Crimson untuk Live Commerce modern',
    primaryColor: '#25F4EE',
    accentColor: '#FE2C55',
    bgDark: '#0b0c10',
    cardDark: '#161823',
    bgLight: '#f4f6fb',
    cardLight: '#ffffff',
    badgeBg: 'bg-[#25F4EE]/15',
    badgeText: 'text-[#25F4EE]',
    primaryGradient: 'from-[#25F4EE] to-[#FE2C55]',
    previewColors: ['#25F4EE', '#FE2C55', '#161823'],
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Mint & Forest',
    description: 'Hijau segar, kemakmuran & kesuksesan finansial',
    primaryColor: '#10B981',
    accentColor: '#059669',
    bgDark: '#061712',
    cardDark: '#0c241d',
    bgLight: '#f0fdf4',
    cardLight: '#ffffff',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    primaryGradient: 'from-emerald-400 to-teal-500',
    previewColors: ['#10B981', '#34D399', '#0c241d'],
  },
  violet: {
    id: 'violet',
    name: 'Royal Violet & Boutique',
    description: 'Aura kemewahan luxury fashion & butik eksklusif',
    primaryColor: '#8B5CF6',
    accentColor: '#EC4899',
    bgDark: '#0f0c1a',
    cardDark: '#19152b',
    bgLight: '#faf5ff',
    cardLight: '#ffffff',
    badgeBg: 'bg-violet-500/15',
    badgeText: 'text-violet-400',
    primaryGradient: 'from-violet-500 to-fuchsia-500',
    previewColors: ['#8B5CF6', '#EC4899', '#19152b'],
  },
  coral: {
    id: 'coral',
    name: 'Rose Gold & Sunset Coral',
    description: 'Hangat, glamour, dan trendi untuk fashion retail',
    primaryColor: '#F43F5E',
    accentColor: '#F59E0B',
    bgDark: '#180c11',
    cardDark: '#26141c',
    bgLight: '#fff1f2',
    cardLight: '#ffffff',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    primaryGradient: 'from-rose-500 to-amber-500',
    previewColors: ['#F43F5E', '#F59E0B', '#26141c'],
  },
  ocean: {
    id: 'ocean',
    name: 'Electric Ocean & Marketplace',
    description: 'Profesional, bersih & terpercaya ala tech marketplace',
    primaryColor: '#0EA5E9',
    accentColor: '#3B82F6',
    bgDark: '#09131f',
    cardDark: '#102033',
    bgLight: '#f0f9ff',
    cardLight: '#ffffff',
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-400',
    primaryGradient: 'from-sky-400 to-blue-600',
    previewColors: ['#0EA5E9', '#3B82F6', '#102033'],
  },
  minimalist: {
    id: 'minimalist',
    name: 'Obsidian & Platinum Studio',
    description: 'Monokrom elegan high-fashion studio minimalis',
    primaryColor: '#E2E8F0',
    accentColor: '#94A3B8',
    bgDark: '#09090b',
    cardDark: '#18181b',
    bgLight: '#f8fafc',
    cardLight: '#ffffff',
    badgeBg: 'bg-zinc-500/15',
    badgeText: 'text-zinc-300',
    primaryGradient: 'from-zinc-200 to-zinc-400',
    previewColors: ['#E2E8F0', '#94A3B8', '#18181b'],
  },
};

export const DEFAULT_THEME: ThemeConfig = {
  mode: 'dark',
  palette: 'neon',
};

type ThemeChangeListener = (theme: ThemeConfig) => void;

export class ThemeService {
  private static listeners: Set<ThemeChangeListener> = new Set();

  static getTheme(): ThemeConfig {
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.palette && THEME_PALETTES[parsed.palette as ThemePalette]) {
          return {
            mode: parsed.mode || 'dark',
            palette: parsed.palette,
          };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_THEME;
  }

  static setTheme(theme: Partial<ThemeConfig>) {
    const current = this.getTheme();
    const updated: ThemeConfig = {
      mode: theme.mode || current.mode,
      palette: theme.palette || current.palette,
    };
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updated));
    this.applyToDOM(updated);
    this.listeners.forEach(fn => fn(updated));
  }

  static subscribe(listener: ThemeChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static applyToDOM(theme?: ThemeConfig) {
    const active = theme || this.getTheme();
    const def = THEME_PALETTES[active.palette] || THEME_PALETTES.neon;

    const root = document.documentElement;
    root.setAttribute('data-theme-palette', active.palette);
    root.setAttribute('data-theme-mode', active.mode);

    const isLight = active.mode === 'light';
    const bgMain = isLight ? def.bgLight : def.bgDark;
    const bgCard = isLight ? def.cardLight : def.cardDark;
    const textMain = isLight ? '#0f172a' : '#f4f4f6';
    const textMuted = isLight ? '#475569' : '#9ca3af';
    const borderColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.1)';

    root.style.setProperty('--primary-color', def.primaryColor);
    root.style.setProperty('--secondary-color', def.accentColor);
    root.style.setProperty('--accent-color', def.primaryColor);
    root.style.setProperty('--bg-main', bgMain);
    root.style.setProperty('--bg-card', bgCard);
    root.style.setProperty('--text-main', textMain);
    root.style.setProperty('--text-muted', textMuted);
    root.style.setProperty('--border-color', borderColor);

    if (isLight) {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }

    if (document.body) {
      document.body.style.backgroundColor = bgMain;
      document.body.style.color = textMain;
    }
  }

  static getDefinition(palette?: ThemePalette): ThemeDefinition {
    const active = palette || this.getTheme().palette;
    return THEME_PALETTES[active] || THEME_PALETTES.neon;
  }
}
