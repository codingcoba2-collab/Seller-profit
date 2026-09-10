export type OutfitMode = 'jersey' | 'full' | 'logo';

export interface OutfitConfig {
  type: 'default-mu' | 'preset' | 'custom';
  presetId?: string;
  name: string;
  imageUrl?: string;
  mode: OutfitMode;
  baseColor: string;
  accentColor: string;
  shortsColor?: string;
  backNumber?: string;
  backName?: string;
}

export interface TouchRipple {
  id: number;
  x: number;
  y: number;
  color: string;
}

export interface PresetOutfit {
  id: string;
  name: string;
  tag: string;
  baseColor: string;
  accentColor: string;
  mode: OutfitMode;
}

export const BASE_COLOR_OPTIONS = [
  { name: 'Merah MU', value: '#C70101', accent: '#FFFFFF' },
  { name: 'Hitam Stealth', value: '#111319', accent: '#25F4EE' },
  { name: 'Putih Bersih', value: '#FAFAFB', accent: '#161823' },
  { name: 'Biru Navy', value: '#0E2140', accent: '#FFC72C' },
  { name: 'Cyber Teal', value: '#083338', accent: '#25F4EE' },
  { name: 'Emas Mewah', value: '#B38F38', accent: '#161823' }
];

export const PRESETS: PresetOutfit[] = [
  { id: 'mu-home', name: 'MU Home 24/25 (Official)', tag: 'Official', baseColor: '#C70101', accentColor: '#FFFFFF', mode: 'jersey' },
  { id: 'mu-away', name: 'MU Away Shadow', tag: 'Stealth', baseColor: '#121624', accentColor: '#A0AEC0', mode: 'jersey' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', tag: 'Sci-Fi', baseColor: '#0a0d14', accentColor: '#25F4EE', mode: 'logo' },
  { id: 'batik', name: 'Batik Nusantara', tag: 'Classic', baseColor: '#2B1A12', accentColor: '#D4AF37', mode: 'full' },
  { id: 'clean-white', name: 'Streetwear Putih', tag: 'Modern', baseColor: '#FAFAFB', accentColor: '#161823', mode: 'logo' }
];

export const AVATAR_RESPONSES = [
  "Hello! Welcome to Seller Profit! Siap pantau closingan live hari ini? GGMU! 🔥",
  "Sentuhan terdeteksi! ❤️ Semangat kejar target omset & laba bersih tokomu!",
  "Manchester United Spirit! Karakter virtual siap mendampingi analisa tokomu!",
  "Hai Kak! Silakan klik tombol 'Masuk / Login' di atas untuk membuka pembukuan.",
  "Halo! Sensor respon aktif. Geser layar ke kiri & kanan untuk melihat detail 360°!"
];
